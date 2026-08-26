import { UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { FilesService } from '@modules/files/files.service';

import { PostsService } from './posts.service';
import type { ProfilesService } from './profiles.service';
import type { SocialGraphService } from './graph.service';

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const PROFILE_ID = 'profile-1';
const OTHER_PROFILE_ID = 'profile-2';
const POST_ID = '0194a1b2-c3d4-7000-8000-000000000010';

const user: AuthenticatedUser = { id: USER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const other: AuthenticatedUser = { id: OTHER_USER_ID, role: UserRole.CUSTOMER, sessionId: 's2' };

function authorProfile(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: PROFILE_ID,
    kind: 'PERSONAL',
    userId: USER_ID,
    businessId: null,
    username: 'musteri',
    displayName: 'Ayşe Yılmaz',
    bio: null,
    avatarFileId: null,
    coverFileId: null,
    locationCityId: null,
    locationText: null,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    isVerifiedDisplay: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    avatar: null,
    cover: null,
    ...overrides,
  };
}

function postRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: POST_ID,
    authorProfileId: PROFILE_ID,
    type: 'TEXT',
    body: 'Merhaba akış',
    visibility: 'PUBLIC',
    likeCount: 0,
    commentCount: 0,
    saveCount: 0,
    viewCount: 0,
    uniqueViewCount: 0,
    shareCount: 0,
    repostCount: 0,
    originalPostId: null,
    hashtags: [],
    mentions: [],
    originalPost: null,
    commerceRequestId: null,
    promoLabel: null,
    originalPriceMinor: null,
    promoPriceMinor: null,
    promoCurrency: null,
    promoValidUntil: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    author: authorProfile(),
    dealMetadata: null,
    media: [],
    ...overrides,
  };
}

type PrismaMock = {
  post: {
    create: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  feedItem: { create: jest.Mock; deleteMany: jest.Mock };
  socialProfile: { update: jest.Mock };
  fileAsset: { findMany: jest.Mock };
  priceHistory: { create: jest.Mock };
  follow: { findMany: jest.Mock };
  categoryFollow: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    post: {
      create: jest.fn().mockResolvedValue(postRow()),
      findFirst: jest.fn().mockResolvedValue(postRow()),
      update: jest.fn().mockResolvedValue({}),
    },
    feedItem: {
      create: jest.fn().mockResolvedValue({ id: 'feed-1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    socialProfile: {
      update: jest.fn().mockResolvedValue({}),
    },
    fileAsset: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    priceHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    follow: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    categoryFollow: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };
  mock.$transaction.mockImplementation(async (fn: (tx: PrismaMock) => unknown) => fn(mock));
  return mock;
}

function notificationsMock() {
  return { dispatchAll: jest.fn().mockResolvedValue(undefined) };
}

function createService(
  prisma: PrismaMock,
  profileId = PROFILE_ID,
  notifications: { dispatchAll: jest.Mock } = notificationsMock(),
) {
  const files = { assertOwnedBy: jest.fn().mockResolvedValue(undefined) } as unknown as FilesService;
  const profiles = {
    ensurePersonalProfile: jest
      .fn()
      .mockResolvedValue(authorProfile({ id: profileId, userId: profileId === PROFILE_ID ? USER_ID : OTHER_USER_ID })),
    ensureBusinessProfile: jest.fn().mockResolvedValue(authorProfile({ id: profileId, kind: 'BUSINESS' })),
  } as unknown as ProfilesService;
  const config = { fileBaseUrl: 'http://localhost:9000/talpio' } as unknown as AppConfigService;
  const rbac = { assertBusinessAccess: jest.fn().mockResolvedValue(undefined) };
  const graph = {
    attachBodyEntities: jest.fn().mockResolvedValue({
      mentionedUserIds: [],
      mentionedNames: new Map(),
    }),
  } as unknown as SocialGraphService;

  return new PostsService(
    prisma as unknown as PrismaService,
    config,
    files,
    profiles,
    rbac as never,
    notifications as never,
    graph,
    { postCreated: jest.fn() } as never,
  );
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

describe('PostsService', () => {
  let prisma: PrismaMock;
  let service: PostsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  it('gönderi oluşturur ve FeedItem yazar', async () => {
    const created = await service.create(user, { body: 'Merhaba akış' });

    expect(created.body).toBe('Merhaba akış');
    expect(prisma.post.create).toHaveBeenCalled();
    expect(prisma.feedItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'POST',
        postId: POST_ID,
        authorProfileId: PROFILE_ID,
      }),
    });
    expect(prisma.socialProfile.update).toHaveBeenCalledWith({
      where: { id: PROFILE_ID },
      data: { postCount: { increment: 1 } },
    });
  });

  it('kampanya fiyatı ile CAMPAIGN gönderisi oluşturur (legacy promo)', async () => {
    prisma.post.create.mockResolvedValue(
      postRow({
        type: 'CAMPAIGN',
        promoLabel: 'Hafta sonu %20',
        originalPriceMinor: 100_00,
        promoPriceMinor: 80_00,
        promoCurrency: 'TRY',
        dealMetadata: {
          title: 'Hafta sonu %20',
          listPriceMinor: 100_00,
          dealPriceMinor: 80_00,
          currency: 'TRY',
          productName: null,
          discountPercent: null,
          unit: null,
          minQuantity: null,
          stockQuantity: null,
          startsAt: null,
          endsAt: null,
          vatIncluded: null,
          shippingIncluded: null,
          locationText: null,
          categoryId: null,
          subcategoryId: null,
          brand: null,
        },
      }),
    );

    const created = await service.create(user, {
      body: 'Motor yağı kampanyası',
      promoLabel: 'Hafta sonu %20',
      originalPriceMinor: 100_00,
      promoPriceMinor: 80_00,
      promoCurrency: 'TRY',
    });

    expect(created.type).toBe('CAMPAIGN');
    expect(created.promo?.promoPriceMinor).toBe(80_00);
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'CAMPAIGN',
          promoPriceMinor: 80_00,
          dealMetadata: expect.objectContaining({
            create: expect.objectContaining({
              dealPriceMinor: 80_00,
              listPriceMinor: 100_00,
            }),
          }),
        }),
      }),
    );
  });

  it('DEAL tipi + deal ile DealMetadata oluşturur', async () => {
    prisma.post.create.mockResolvedValue(
      postRow({
        type: 'DEAL',
        promoLabel: '5W-30',
        originalPriceMinor: 120_00,
        promoPriceMinor: 99_00,
        promoCurrency: 'TRY',
        dealMetadata: {
          title: '5W-30',
          productName: 'Shell Helix',
          listPriceMinor: 120_00,
          dealPriceMinor: 99_00,
          currency: 'TRY',
          discountPercent: 17,
          unit: 'adet',
          minQuantity: '12',
          stockQuantity: null,
          startsAt: null,
          endsAt: null,
          vatIncluded: true,
          shippingIncluded: null,
          locationText: null,
          categoryId: null,
          subcategoryId: null,
          brand: 'Shell',
        },
      }),
    );

    const created = await service.create(user, {
      body: 'Toplu yağ fırsatı',
      type: 'DEAL',
      deal: {
        title: '5W-30',
        productName: 'Shell Helix',
        listPriceMinor: 120_00,
        dealPriceMinor: 99_00,
        currency: 'TRY',
        discountPercent: 17,
        unit: 'adet',
        minQuantity: '12',
        brand: 'Shell',
        vatIncluded: true,
      },
    });

    expect(created.type).toBe('DEAL');
    expect(created.deal?.dealPriceMinor).toBe(99_00);
    expect(created.promo?.promoPriceMinor).toBe(99_00);
    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'DEAL',
          dealMetadata: {
            create: expect.objectContaining({
              productName: 'Shell Helix',
              dealPriceMinor: 99_00,
              brand: 'Shell',
            }),
          },
        }),
      }),
    );
  });

  it('TEXT + deal gönderince tipi DEAL yapar', async () => {
    prisma.post.create.mockResolvedValue(
      postRow({
        type: 'DEAL',
        dealMetadata: {
          title: 'Fırsat',
          dealPriceMinor: 50_00,
          currency: 'TRY',
          productName: null,
          listPriceMinor: null,
          discountPercent: null,
          unit: null,
          minQuantity: null,
          stockQuantity: null,
          startsAt: null,
          endsAt: null,
          vatIncluded: null,
          shippingIncluded: null,
          locationText: null,
          categoryId: null,
          subcategoryId: null,
          brand: null,
        },
      }),
    );

    await service.create(user, {
      body: 'Fırsat metni yeterince uzun',
      deal: { title: 'Fırsat', dealPriceMinor: 50_00, currency: 'TRY' },
    });

    expect(prisma.post.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'DEAL' }),
      }),
    );
  });

  describe('kampanya bildirimi', () => {
    /** Bildirim `create` içinde fire-and-forget çağrıldığı için doğrudan çalıştırılır. */
    function notifyAudience(
      service: PostsService,
      post: Record<string, unknown>,
      actorUserId = USER_ID,
    ) {
      return (
        service as unknown as {
          notifyCampaignAudience: (
            post: unknown,
            authorProfileId: string,
            actorUserId: string,
          ) => Promise<void>;
        }
      ).notifyCampaignAudience(post, PROFILE_ID, actorUserId);
    }

    function campaignPost(categoryId: string | null = 'cat-1') {
      return {
        id: POST_ID,
        type: 'CAMPAIGN',
        body: 'Hafta sonu motor yağı kampanyası',
        author: { id: PROFILE_ID, displayName: 'Yağ A.Ş.' },
        promo: { label: 'Hafta sonu %20' },
        deal: { title: 'Hafta sonu %20', categoryId },
      };
    }

    it('takipçilere ve kategori takipçilerine gönderir, tekilleştirir', async () => {
      const notifications = notificationsMock();
      const service = createService(prisma, PROFILE_ID, notifications);
      prisma.follow.findMany.mockResolvedValue([
        { follower: { userId: 'follower-1' } },
        { follower: { userId: 'shared-user' } },
      ]);
      prisma.categoryFollow.findMany.mockResolvedValue([
        { profile: { userId: 'shared-user' } },
        { profile: { userId: 'interest-1' } },
      ]);

      await notifyAudience(service, campaignPost());

      expect(prisma.categoryFollow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 'cat-1', profile: { deletedAt: null } },
        }),
      );
      const inputs = notifications.dispatchAll.mock.calls[0]?.[0] as Array<{
        userId: string;
        type: string;
      }>;
      expect(inputs.map((input) => input.userId)).toEqual([
        'follower-1',
        'shared-user',
        'interest-1',
      ]);
      expect(inputs.every((input) => input.type === 'CAMPAIGN')).toBe(true);
    });

    it('kampanyayı paylaşan kullanıcıya bildirim göndermez', async () => {
      const notifications = notificationsMock();
      const service = createService(prisma, PROFILE_ID, notifications);
      prisma.follow.findMany.mockResolvedValue([{ follower: { userId: 'follower-1' } }]);
      prisma.categoryFollow.findMany.mockResolvedValue([
        { profile: { userId: USER_ID } },
        { profile: { userId: null } },
      ]);

      await notifyAudience(service, campaignPost());

      const inputs = notifications.dispatchAll.mock.calls[0]?.[0] as Array<{ userId: string }>;
      expect(inputs.map((input) => input.userId)).toEqual(['follower-1']);
    });

    it('kategori yoksa yalnızca takipçilere gönderir', async () => {
      const notifications = notificationsMock();
      const service = createService(prisma, PROFILE_ID, notifications);
      prisma.follow.findMany.mockResolvedValue([{ follower: { userId: 'follower-1' } }]);

      await notifyAudience(service, campaignPost(null));

      expect(prisma.categoryFollow.findMany).not.toHaveBeenCalled();
      const inputs = notifications.dispatchAll.mock.calls[0]?.[0] as Array<{ userId: string }>;
      expect(inputs.map((input) => input.userId)).toEqual(['follower-1']);
    });

    it('kampanya olmayan gönderi için bildirim üretmez', async () => {
      const notifications = notificationsMock();
      const service = createService(prisma, PROFILE_ID, notifications);

      await notifyAudience(service, { ...campaignPost(), type: 'TEXT' });

      expect(prisma.follow.findMany).not.toHaveBeenCalled();
      expect(notifications.dispatchAll).not.toHaveBeenCalled();
    });

    it('alıcı sayısını 750 ile sınırlar', async () => {
      const notifications = notificationsMock();
      const service = createService(prisma, PROFILE_ID, notifications);
      prisma.follow.findMany.mockResolvedValue(
        Array.from({ length: 500 }, (_, index) => ({ follower: { userId: `f-${index}` } })),
      );
      prisma.categoryFollow.findMany.mockResolvedValue(
        Array.from({ length: 500 }, (_, index) => ({ profile: { userId: `c-${index}` } })),
      );

      await notifyAudience(service, campaignPost());

      const inputs = notifications.dispatchAll.mock.calls[0]?.[0] as Array<{ userId: string }>;
      expect(inputs).toHaveLength(750);
      expect(inputs[0]?.userId).toBe('f-0');
    });
  });

  it('başkasının gönderisini silmeye izin vermez', async () => {
    prisma.post.findFirst.mockResolvedValue(postRow({ authorProfileId: PROFILE_ID }));
    const otherService = createService(prisma, OTHER_PROFILE_ID);

    const code = await codeOfRejection(() => otherService.delete(other, POST_ID));
    expect(code).toBe('FORBIDDEN_RESOURCE');
    expect(prisma.post.update).not.toHaveBeenCalled();
  });
});
