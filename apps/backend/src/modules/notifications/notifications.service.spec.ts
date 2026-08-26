import { DevicePlatform, NotificationChannel, NotificationType, UserRole } from '@talpio/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import {
  MockEmailSender,
  MockPushSender,
  MockSmsSender,
} from '@infra/notifications/mock-notification.senders';
import { NotificationOutbox } from '@infra/notifications/notification-outbox';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { channelsFor } from './notification-channels';
import { NotificationsService } from './notifications.service';

const USER_ID = 'customer-1';
const NOTIFICATION_ID = '0194a1b2-c3d4-7000-8000-000000000001';

const user: AuthenticatedUser = { id: USER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: NOTIFICATION_ID,
    userId: USER_ID,
    type: NotificationType.OFFER_RECEIVED,
    params: { jobTitle: 'Kombi bakımı', providerName: 'Yılmaz Ticaret' },
    channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
    deepLink: 'talpio://job-offers/job-1',
    readAt: null,
    sentAt: null,
    createdAt: new Date('2026-02-01T10:00:00.000Z'),
    ...overrides,
  };
}

function recipientRow(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    email: 'musteri@talpio.com',
    phone: '+905551112233',
    fullName: 'Demo Müşteri',
    locale: 'tr',
    deviceTokens: [{ token: 'ExponentPushToken[abcdefghijklmnop]', locale: 'tr' }],
    ...overrides,
  };
}

type PrismaMock = {
  notification: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  notificationPreference: { findUnique: jest.Mock };
  deviceToken: { upsert: jest.Mock; updateMany: jest.Mock };
  user: { findFirst: jest.Mock; findUnique: jest.Mock };
};

function createPrismaMock(): PrismaMock {
  return {
    notification: {
      findMany: jest.fn().mockResolvedValue([notificationRow()]),
      findUnique: jest.fn().mockResolvedValue(notificationRow()),
      count: jest.fn().mockResolvedValue(3),
      create: jest.fn().mockResolvedValue(notificationRow()),
      update: jest.fn().mockResolvedValue(notificationRow({ readAt: new Date() })),
      updateMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    notificationPreference: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    deviceToken: {
      upsert: jest.fn().mockResolvedValue({
        id: 'device-1',
        userId: USER_ID,
        platform: DevicePlatform.ANDROID,
        token: 'ExponentPushToken[abcdefghijklmnop]',
        locale: 'tr',
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findFirst: jest.fn().mockResolvedValue(recipientRow()),
      findUnique: jest.fn().mockResolvedValue({ locale: 'tr' }),
    },
  };
}

function createConfig(): AppConfigService {
  return {
    isProduction: false,
    defaultLocale: 'tr',
    notifications: {
      pushDriver: 'mock',
      mailDriver: 'mock',
      smsDriver: 'mock',
      mailFrom: 'Talpio <no-reply@talpio.com>',
      smsSender: 'TALPIO',
      outboxLimit: 50,
    },
  } as unknown as AppConfigService;
}

function createService(prisma: PrismaMock, config: AppConfigService = createConfig()) {
  const outbox = new NotificationOutbox(config);

  const service = new NotificationsService(
    prisma as unknown as PrismaService,
    config,
    outbox,
    new MockPushSender(outbox),
    new MockEmailSender(outbox, config),
    new MockSmsSender(outbox, config),
  );

  return { service, outbox };
}

function listQuery(overrides: Record<string, unknown> = {}): ListNotificationsQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
}

async function codeOfRejection(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

describe('channelsFor', () => {
  it('her tür için IN_APP taşır', () => {
    for (const type of Object.values(NotificationType)) {
      expect(channelsFor(type)).toContain(NotificationChannel.IN_APP);
    }
  });

  it('mesaj bildirimini e-postayla göndermez', () => {
    expect(channelsFor(NotificationType.MESSAGE_RECEIVED)).not.toContain(NotificationChannel.EMAIL);
  });
});

describe('NotificationsService', () => {
  let prisma: PrismaMock;
  let service: NotificationsService;
  let outbox: NotificationOutbox;

  beforeEach(() => {
    prisma = createPrismaMock();
    ({ service, outbox } = createService(prisma));
  });

  describe('dispatch', () => {
    it('kaydı yazar ve dış kanallara gönderir', async () => {
      await service.dispatch({
        userId: USER_ID,
        type: NotificationType.OFFER_RECEIVED,
        params: {
          jobTitle: 'Kombi bakımı',
          providerName: 'Yılmaz Ticaret',
          amountMinor: 180000,
          currency: 'TRY',
        },
        deepLink: 'talpio://job-offers/job-1',
      });

      const { data } = firstCallArg<{ data: { type: string; channels: string[] } }>(
        prisma.notification.create,
      );
      expect(data.type).toBe(NotificationType.OFFER_RECEIVED);
      expect(data.channels).toContain(NotificationChannel.IN_APP);

      expect(outbox.list({ channel: NotificationChannel.PUSH })).toHaveLength(1);
      expect(outbox.list({ channel: NotificationChannel.EMAIL })).toHaveLength(1);
    });

    it('yalnızca uygulama içi kanalda dış gönderim yapmaz', async () => {
      await service.dispatch({
        userId: USER_ID,
        type: NotificationType.CAMPAIGN,
        params: { title: 'Kış bakımı', message: 'Kombi bakımında indirim' },
      });

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(outbox.list()).toHaveLength(0);
    });

    it('gönderim hatasını yutar', async () => {
      prisma.notification.create.mockRejectedValue(new Error('bağlantı koptu'));

      await expect(
        service.dispatch({
          userId: USER_ID,
          type: NotificationType.JOB_STARTED,
          params: { jobTitle: 'Kombi bakımı', providerName: 'Yılmaz Ticaret' },
        }),
      ).resolves.toBeUndefined();
    });

    it('silinmiş kullanıcıya kayıt yazmaz', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await service.dispatch({
        userId: 'yok',
        type: NotificationType.JOB_COMPLETED,
        params: { jobTitle: 'Kombi bakımı', providerName: 'Yılmaz Ticaret' },
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('aynı dedupeKey ile ikinci bildirimi yazmaz', async () => {
      prisma.notification.findUnique.mockResolvedValue(notificationRow({ dedupeKey: 'k1' }));

      await service.dispatch({
        userId: USER_ID,
        type: NotificationType.REQUEST_MATCHED,
        params: {
          requestId: 'req-1',
          requestTitle: 'Motor yağı',
          categoryName: 'Yağ',
          cityName: 'Gaziantep',
          shortDescription: '200 lt',
          deadline: '',
          matchScore: 82,
        },
        dedupeKey: 'request.matched:req-1:user-1',
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('kanal tercihleri kapalıysa gönderim yapmaz', async () => {
      prisma.notificationPreference.findUnique.mockResolvedValue({
        inApp: false,
        push: false,
        email: false,
        sms: false,
      });

      await service.dispatch({
        userId: USER_ID,
        type: NotificationType.REQUEST_MATCHED,
        params: {
          requestId: 'req-1',
          requestTitle: 'Motor yağı',
          categoryName: 'Yağ',
          cityName: 'Gaziantep',
          shortDescription: '200 lt',
          deadline: '',
          matchScore: 82,
        },
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('cihaz jetonu olmayan kullanıcıda push düşse de kayıt kalır', async () => {
      prisma.user.findFirst.mockResolvedValue(recipientRow({ deviceTokens: [] }));

      await service.dispatch({
        userId: USER_ID,
        type: NotificationType.JOB_MATCHED,
        params: { jobTitle: 'Priz arızası', categoryName: 'Elektrik', districtName: 'Şahinbey' },
      });

      expect(prisma.notification.create).toHaveBeenCalled();
      expect(outbox.list({ channel: NotificationChannel.PUSH })).toHaveLength(0);
      // Hiçbir kanal gönderemediyse damga basılmaz.
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('listeleme', () => {
    it('okunmamış sayacını süzgeçten bağımsız döner', async () => {
      prisma.notification.count.mockResolvedValueOnce(1).mockResolvedValueOnce(7);

      const result = await service.listMine(user, listQuery({ unread: true }));

      expect(result.meta.total).toBe(1);
      expect(result.meta.unreadCount).toBe(7);

      const { where } = firstCallArg<{ where: { readAt: null | undefined } }>(
        prisma.notification.findMany,
      );
      expect(where.readAt).toBeNull();
    });

    it('yalnızca oturumdaki kullanıcının bildirimlerini sorgular', async () => {
      await service.listMine(user, listQuery());

      const { where } = firstCallArg<{ where: { userId: string } }>(prisma.notification.findMany);
      expect(where.userId).toBe(USER_ID);
    });
  });

  describe('okundu işaretleme', () => {
    it('okundu damgasını basar', async () => {
      const updated = await service.markRead(user, NOTIFICATION_ID);

      expect(updated.readAt).toBeTruthy();
    });

    it('ikinci çağrıda ilk okuma zamanını korur', async () => {
      const readAt = new Date('2026-02-02T08:00:00.000Z');
      prisma.notification.findUnique.mockResolvedValue(notificationRow({ readAt }));

      const result = await service.markRead(user, NOTIFICATION_ID);

      expect(prisma.notification.update).not.toHaveBeenCalled();
      expect(result.readAt).toBe(readAt.toISOString());
    });

    it('başkasının bildirimini göstermez', async () => {
      prisma.notification.findUnique.mockResolvedValue(notificationRow({ userId: 'baska' }));

      await expect(codeOfRejection(() => service.markRead(user, NOTIFICATION_ID))).resolves.toBe(
        'NOT_FOUND',
      );
    });

    it('tümünü okundu işaretler', async () => {
      const result = await service.markAllRead(user);

      expect(result.updatedCount).toBe(3);
      const { where } = firstCallArg<{ where: { userId: string; readAt: null } }>(
        prisma.notification.updateMany,
      );
      expect(where.userId).toBe(USER_ID);
      expect(where.readAt).toBeNull();
    });
  });

  describe('cihaz jetonu', () => {
    it('aynı jetonu ikinci kayıtta günceller', async () => {
      await service.registerDeviceToken(user, {
        token: 'ExponentPushToken[abcdefghijklmnop]',
        platform: DevicePlatform.ANDROID,
      });

      const call = firstCallArg<{ where: { token: string }; update: { lastSeenAt: Date } }>(
        prisma.deviceToken.upsert,
      );
      expect(call.where.token).toBe('ExponentPushToken[abcdefghijklmnop]');
      expect(call.update.lastSeenAt).toBeInstanceOf(Date);
    });

    it('yalnızca kendi jetonunu siler', async () => {
      await service.removeDeviceToken(user, 'ExponentPushToken[abcdefghijklmnop]');

      const { where } = firstCallArg<{ where: { userId: string } }>(prisma.deviceToken.updateMany);
      expect(where.userId).toBe(USER_ID);
    });
  });

  describe('mock tamponu', () => {
    it('production ortamında kapalıdır', () => {
      const config = { ...createConfig(), isProduction: true } as AppConfigService;
      const { service: productionService } = createService(prisma, config);

      expect(() => productionService.listOutbox()).toThrow(AppException);
    });
  });
});
