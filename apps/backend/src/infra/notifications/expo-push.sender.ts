import { Injectable, Logger } from '@nestjs/common';
import { renderNotification } from '@talpio/localization';
import { NotificationChannel } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';

import { NotificationOutbox } from './notification-outbox';
import type {
  NotificationMessage,
  PushSender,
  PushTarget,
  SendResult,
} from './notification-sender';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Expo tek istekte en fazla 100 ileti kabul eder. */
const EXPO_BATCH_SIZE = 100;

const REQUEST_TIMEOUT_MS = 15_000;

/** Jetonun sahibi uygulamayı sildi veya bildirimi kapattı; jeton bir daha çalışmaz. */
const DEVICE_NOT_REGISTERED = 'DeviceNotRegistered';

/** Expo'nun her ileti için döndürdüğü bilet. */
interface ExpoTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoTicket[];
  /** İstek gövdesi hiç işlenemediğinde bilet yerine bu alan gelir. */
  errors?: { message?: string }[];
}

/**
 * Expo Push API sürücüsü.
 *
 * Mobil uygulama `getExpoPushTokenAsync` ile `ExponentPushToken[...]` biçiminde
 * jeton kaydeder; bu jetonlar APNs/FCM'e doğrudan verilemez, Expo'nun geçidinden
 * geçmek zorundadır. Karşılığında sunucu tarafında servis hesabı veya sertifika
 * tutmaya gerek kalmaz — `EXPO_ACCESS_TOKEN` bile isteğe bağlıdır.
 *
 * Push gövdesi işletim sisteminin bildirim çekmecesinde göründüğü için metin
 * burada, alıcının diliyle çözülür. Uygulama içi listeyle aynı çeviri kataloğu
 * kullanılır; metin bir yerde değişince ikisi birlikte değişir.
 */
@Injectable()
export class ExpoPushSender implements PushSender {
  readonly name = 'expo';
  private readonly logger = new Logger(ExpoPushSender.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
    private readonly prisma: PrismaService,
  ) {}

  async send(target: PushTarget, message: NotificationMessage): Promise<SendResult> {
    if (target.tokens.length === 0) {
      return { delivered: false, failureReason: 'Kayıtlı cihaz jetonu yok.' };
    }

    const { title, body } = renderNotification(message.type, message.params, message.locale);

    const accepted: string[] = [];
    const stale: string[] = [];
    const failures: string[] = [];

    for (const batch of chunk(target.tokens, EXPO_BATCH_SIZE)) {
      let tickets: ExpoTicket[];
      try {
        tickets = await this.post(batch, title, body, message);
      } catch (error) {
        // Ağ kesintisi ya da zaman aşımı bir bildirim uğruna süreci düşürmez;
        // sonraki parça yine denenir, sonuç `SendResult` ile bildirilir.
        const reason = describeError(error);
        this.logger.warn(`Expo push isteği başarısız: ${reason}`);
        failures.push(reason);
        continue;
      }

      batch.forEach((token, index) => {
        const ticket = tickets[index];

        if (ticket?.status === 'ok') {
          accepted.push(token);
          return;
        }

        if (ticket?.details?.error === DEVICE_NOT_REGISTERED) stale.push(token);
        failures.push(ticket?.message ?? 'Expo bileti okunamadı.');
      });
    }

    for (const token of accepted) {
      this.outbox.record({
        channel: NotificationChannel.PUSH,
        target: token,
        type: message.type,
        params: message.params,
        deepLink: message.deepLink,
        locale: message.locale,
        sentAt: new Date().toISOString(),
      });
    }

    await this.revokeStaleTokens(stale);

    if (accepted.length === 0) {
      return { delivered: false, failureReason: failures[0] ?? 'Expo hiçbir jetonu kabul etmedi.' };
    }

    if (failures.length > 0) {
      this.logger.debug(
        `Expo push: ${accepted.length} kabul, ${failures.length} ret (${message.type})`,
      );
    }

    return { delivered: true, failureReason: null };
  }

  private async post(
    tokens: string[],
    title: string,
    body: string,
    message: NotificationMessage,
  ): Promise<ExpoTicket[]> {
    const accessToken = this.config.notifications.expoAccessToken;

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(
        tokens.map((token) => ({
          to: token,
          title,
          body,
          sound: 'default',
          // Uygulama bildirime dokunulduğunda hedefi buradan okur; metin değil
          // ham tür ve parametreler gider ki istemci kendi diliyle gösterebilsin.
          data: {
            type: message.type,
            deepLink: message.deepLink ?? '',
            locale: message.locale,
            params: message.params ?? {},
          },
        })),
      ),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Expo HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const payload = (await response.json()) as ExpoPushResponse;

    const requestError = payload.errors?.[0];
    if (requestError) throw new Error(requestError.message ?? 'Expo isteği reddetti.');

    return payload.data ?? [];
  }

  /**
   * Ölü jetonları kapatır.
   *
   * Expo `DeviceNotRegistered` dediğinde jeton kalıcı olarak geçersizdir;
   * temizlenmezse her bildirimde tekrar denenir ve kayıt sonsuza kadar birikir.
   * Satır silinmez, `revokedAt` damgalanır: kullanıcı uygulamayı yeniden
   * kurduğunda aynı satır `registerDeviceToken` ile canlandırılır.
   */
  private async revokeStaleTokens(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;

    try {
      const result = await this.prisma.deviceToken.updateMany({
        where: { token: { in: tokens }, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      if (result.count > 0) {
        this.logger.log(`${result.count} geçersiz cihaz jetonu kapatıldı.`);
      }
    } catch (error) {
      // Temizlik gönderimin sonucunu değiştirmez; bir sonraki denemede tekrar
      // aynı hata gelirse yine denenecek.
      this.logger.warn(`Cihaz jetonu temizliği başarısız: ${describeError(error)}`);
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
