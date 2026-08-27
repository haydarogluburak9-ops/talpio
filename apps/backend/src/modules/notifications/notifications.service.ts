import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationType,
  type DeviceToken,
  type Notification,
  type NotificationDispatch,
  type NotificationFeedMeta,
  type NotificationParams,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { buildPaginationMeta, PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import type { OutboxEntry } from '@infra/notifications/notification-outbox';
import { NotificationOutbox } from '@infra/notifications/notification-outbox';
import {
  EMAIL_SENDER,
  PUSH_SENDER,
  SMS_SENDER,
  type EmailSender,
  type NotificationMessage,
  type PushSender,
  type SendResult,
  type SmsSender,
} from '@infra/notifications/notification-sender';
import { MetricsService } from '@infra/metrics/metrics.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import type { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { channelsFor } from './notification-channels';
import { toDeviceToken, toNotification } from './notification.mapper';

/** Alan modüllerinin kullandığı tek giriş noktasının girdisi. */
export type DispatchInput = NotificationDispatch & {
  userId: string;
  /** Bildirime dokunulduğunda gidilecek hedef; `deepLinks` yardımcısıyla üretilir. */
  deepLink?: string | null;
  /** Aynı anahtar ikinci kez in-app satırı yazılmaz. */
  dedupeKey?: string | null;
};

const recipientSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  locale: true,
  deviceTokens: { where: { revokedAt: null }, select: { token: true, locale: true } },
} satisfies Prisma.UserSelect;

type Recipient = Prisma.UserGetPayload<{ select: typeof recipientSelect }>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
    @Inject(PUSH_SENDER) private readonly push: PushSender,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  // -------------------------------------------------------------------------
  // Üretim — alan modülleri buradan çağırır
  // -------------------------------------------------------------------------

  /**
   * Bildirimi yazar ve kanallara dağıtır.
   *
   * Çağıranın `$transaction` bloğunun **dışında** çalıştırılmalıdır: dış servis
   * beklenirken satır kilidi tutmak, yavaş bir sağlayıcıda tüm iş akışını
   * durdurur. Bu yüzden servis kendi bağlantısını kullanır ve çağıranın
   * işlemini paylaşmaz.
   *
   * Hiçbir koşulda fırlatmaz. Teklif verilemedi diye değil, bildirim gidemedi
   * diye bir siparişin başarısız olması kabul edilemez; hata yutulur ama
   * günlüğe yazılır.
   */
  async dispatch(input: DispatchInput): Promise<void> {
    try {
      await this.deliver(input);
    } catch (error) {
      // Ana akış çoktan tamamlandı; burada yapılacak tek şey izi bırakmaktır.
      this.metrics?.increment('notification_failures');
      this.logger.error(
        { userId: input.userId, type: input.type, error: describeError(error) },
        'Bildirim gönderilemedi',
      );
    }
  }

  /**
   * Worker yolu: hata yutulmaz, BullMQ yeniden dener ve tükenince DLQ'ya düşer.
   * HTTP istekleri `dispatch` kullanmaya devam eder.
   */
  async dispatchStrict(input: DispatchInput): Promise<void> {
    try {
      await this.deliver(input);
    } catch (error) {
      this.metrics?.increment('notification_failures');
      throw error;
    }
  }

  /**
   * Aynı olayı birden çok alıcıya duyurur (ör. eşleşen satıcılar).
   *
   * Alıcılar birbirinden bağımsızdır; biri düşse diğerleri gönderilir.
   */
  async dispatchAll(inputs: DispatchInput[]): Promise<void> {
    await Promise.all(inputs.map((input) => this.dispatch(input)));
  }

  // -------------------------------------------------------------------------
  // Uçlar
  // -------------------------------------------------------------------------

  async listMine(
    user: AuthenticatedUser,
    query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<Notification, NotificationFeedMeta>> {
    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
      ...(query.unread ? { readAt: null } : {}),
      ...(query.type?.length ? { type: { in: query.type } } : {}),
    };

    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: query.toOrderBy(['createdAt']),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
      this.unreadCount(user.id),
    ]);

    // Okunmamış sayacı süzgeçten bağımsızdır: rozet, listede ne gösterildiğine
    // değil kullanıcının toplam okunmamışına bakar.
    return new PaginatedResult(rows.map(toNotification), {
      ...buildPaginationMeta(total, query.page, query.limit),
      unreadCount,
    });
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(user: AuthenticatedUser, id: string): Promise<Notification> {
    const row = await this.prisma.notification.findUnique({ where: { id } });

    if (!row || row.userId !== user.id) throw AppException.notFound('Bildirim', id);

    // Okundu damgası bir kez basılır; tekrar çağrıda ilk okuma zamanı korunur.
    if (row.readAt) return toNotification(row);

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return toNotification(updated);
  }

  async markAllRead(user: AuthenticatedUser): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return { updatedCount: result.count };
  }

  /**
   * Cihaz jetonunu kaydeder.
   *
   * Jeton benzersiz olduğu için aynı jeton başka bir hesapla gelirse kayıt o
   * hesaba taşınır: cihazda oturum değişmiştir ve bildirimin eski kullanıcıya
   * gitmesi bilgi sızdırmak olurdu.
   */
  async registerDeviceToken(
    user: AuthenticatedUser,
    dto: RegisterDeviceTokenDto,
  ): Promise<DeviceToken> {
    const account = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { locale: true },
    });

    const locale = dto.locale ?? account?.locale ?? this.config.defaultLocale;

    const row = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId: user.id,
        token: dto.token,
        platform: dto.platform,
        locale,
      },
      update: {
        userId: user.id,
        platform: dto.platform,
        locale,
        lastSeenAt: new Date(),
        revokedAt: null,
      },
    });

    return toDeviceToken(row);
  }

  /** Oturum kapatıldığında çağrılır; başkasının jetonu silinemez. */
  async removeDeviceToken(user: AuthenticatedUser, token: string): Promise<{ removed: boolean }> {
    const result = await this.prisma.deviceToken.updateMany({
      where: { token, userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { removed: result.count > 0 };
  }

  async revokeAllDeviceTokens(userId: string): Promise<number> {
    const result = await this.prisma.deviceToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /**
   * Mock sürücülerin gönderim tamponu.
   *
   * Yalnızca production dışında çağrılabilir; duman testi gönderimin gerçekten
   * yapıldığını buradan doğrular.
   */
  listOutbox(): OutboxEntry[] {
    // İzin verilenler listesi kullanılır: `!isProduction` yazılırsa `staging`
    // de kapsam dışında kalır ve tampon internete açık bir sunucuda okunabilir.
    if (!this.config.isDevelopment && this.config.nodeEnv !== 'test') {
      throw new AppException('NOT_FOUND', {
        message: 'Bu uç yalnızca geliştirme ortamında açıktır.',
      });
    }

    return this.outbox.list();
  }

  // -------------------------------------------------------------------------

  private async deliver(input: DispatchInput): Promise<void> {
    const recipient = await this.prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
      select: recipientSelect,
    });

    if (!recipient) {
      this.logger.warn(
        { userId: input.userId, type: input.type },
        'Bildirim alıcısı bulunamadı; gönderim atlandı',
      );
      return;
    }

    if (input.dedupeKey) {
      const existing = await this.prisma.notification.findUnique({
        where: { dedupeKey: input.dedupeKey },
        select: { id: true },
      });
      if (existing) return;
    }

    const channels = await this.resolveChannels(recipient.id, input.type);
    if (channels.length === 0) {
      this.logger.debug(
        { userId: recipient.id, type: input.type },
        'Bildirim kanalları tercih nedeniyle boş; gönderim atlandı',
      );
      return;
    }

    const params = input.params as unknown as NotificationParams;
    const deepLink = input.deepLink ?? null;

    let created;
    try {
      created = await this.prisma.notification.create({
        data: {
          userId: recipient.id,
          type: input.type,
          params: params,
          channels,
          deepLink,
          dedupeKey: input.dedupeKey ?? null,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error) && input.dedupeKey) return;
      throw error;
    }

    const external = channels.filter((channel) => channel !== NotificationChannel.IN_APP);
    if (external.length === 0) return;

    const message: NotificationMessage = {
      type: input.type,
      params,
      deepLink,
      locale: recipient.locale,
    };

    const results = await Promise.all(
      external.map((channel) => this.sendTo(channel, recipient, message)),
    );

    if (results.some((result) => result.delivered)) {
      await this.prisma.notification.update({
        where: { id: created.id },
        data: { sentAt: new Date() },
      });
    }
  }

  private async sendTo(
    channel: NotificationChannel,
    recipient: Recipient,
    message: NotificationMessage,
  ): Promise<SendResult> {
    try {
      const result = await this.callSender(channel, recipient, message);

      if (!result.delivered) {
        // Beklenen düşüşler (cihaz jetonu yok, telefon kayıtlı değil) hata
        // değildir; yine de sessizce geçilmez.
        this.logger.debug(
          { userId: recipient.id, channel, type: message.type, reason: result.failureReason },
          'Bildirim kanalı gönderim yapmadı',
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        { userId: recipient.id, channel, type: message.type, error: describeError(error) },
        'Bildirim kanalı hata verdi',
      );
      return { delivered: false, failureReason: describeError(error) };
    }
  }

  private callSender(
    channel: NotificationChannel,
    recipient: Recipient,
    message: NotificationMessage,
  ): Promise<SendResult> {
    switch (channel) {
      case NotificationChannel.PUSH: {
        const tokens = recipient.deviceTokens.map((device) => device.token);
        return this.push.send({ tokens }, message);
      }
      case NotificationChannel.EMAIL:
        return this.email.send({ email: recipient.email, name: recipient.fullName }, message);
      case NotificationChannel.SMS:
        return recipient.phone
          ? this.sms.send({ phone: recipient.phone }, message)
          : Promise.resolve({ delivered: false, failureReason: 'Kayıtlı telefon yok.' });
      default:
        return Promise.resolve({ delivered: false, failureReason: 'Bilinmeyen kanal.' });
    }
  }

  private async resolveChannels(
    userId: string,
    type: NotificationType,
  ): Promise<NotificationChannel[]> {
    const defaults = channelsFor(type);
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type } },
      select: { inApp: true, push: true, email: true, sms: true },
    });
    if (!pref) return defaults;

    return defaults.filter((channel) => {
      switch (channel) {
        case NotificationChannel.IN_APP:
          return pref.inApp;
        case NotificationChannel.PUSH:
          return pref.push;
        case NotificationChannel.EMAIL:
          return pref.email;
        case NotificationChannel.SMS:
          return pref.sms;
        default:
          return false;
      }
    });
  }
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}
