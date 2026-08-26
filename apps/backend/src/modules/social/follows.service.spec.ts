import { UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { FeedCacheService } from '@infra/cache/feed-cache.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { FollowsService } from './follows.service';
import type { ProfilesService } from './profiles.service';

const ACTOR_ID = 'user-1';
const TARGET_USER_ID = 'user-2';
const ME_PROFILE_ID = 'profile-me';
const TARGET_PROFILE_ID = 'profile-target';

const actor: AuthenticatedUser = { id: ACTOR_ID, role: UserRole.CUSTOMER, sessionId: 's1' };

function profile(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: ME_PROFILE_ID,
    kind: 'PERSONAL',
    userId: ACTOR_ID,
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

type PrismaMock = {
  socialProfile: { findFirst: jest.Mock; update: jest.Mock };
  follow: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock };
  userBlock: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    socialProfile: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    follow: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'follow-1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    userBlock: { findFirst: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(),
  };
  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));
  return mock;
}

function createService(prisma: PrismaMock) {
  const profiles = {
    ensurePersonalProfile: jest.fn().mockResolvedValue(profile()),
    getByUsername: jest.fn().mockResolvedValue(
      profile({
        id: TARGET_PROFILE_ID,
        userId: TARGET_USER_ID,
        username: 'satıcı',
        displayName: 'Mehmet Demir',
        followerCount: 1,
        isFollowing: true,
      }),
    ),
  } as unknown as ProfilesService;

  const notifications = {
    dispatch: jest.fn().mockResolvedValue(undefined),
  };

  const config = { fileBaseUrl: 'http://localhost:9000/talpio' } as unknown as AppConfigService;

  const feedCache = {
    bumpUserVersion: jest.fn().mockResolvedValue(undefined),
  };

  return {
    service: new FollowsService(
      prisma as unknown as PrismaService,
      config,
      profiles,
      notifications as never,
      feedCache as unknown as FeedCacheService,
    ),
    profiles,
    notifications,
    feedCache,
  };
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

describe('FollowsService', () => {
  let prisma: PrismaMock;
  let service: FollowsService;
  let notifications: { dispatch: jest.Mock };

  beforeEach(() => {
    prisma = createPrismaMock();
    const created = createService(prisma);
    service = created.service;
    notifications = created.notifications;
    prisma.socialProfile.findFirst.mockResolvedValue(
      profile({ id: TARGET_PROFILE_ID, userId: TARGET_USER_ID, username: 'satıcı' }),
    );
  });

  it('takip sayaçlarını artırır ve bildirim gönderir', async () => {
    await service.follow(actor, 'satıcı');

    expect(prisma.follow.create).toHaveBeenCalled();
    expect(prisma.socialProfile.update).toHaveBeenCalledWith({
      where: { id: ME_PROFILE_ID },
      data: { followingCount: { increment: 1 } },
    });
    expect(prisma.socialProfile.update).toHaveBeenCalledWith({
      where: { id: TARGET_PROFILE_ID },
      data: { followerCount: { increment: 1 } },
    });
    expect(notifications.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: TARGET_USER_ID,
        type: 'SOCIAL_FOLLOW',
      }),
    );
  });

  it('kendini takip etmeye izin vermez', async () => {
    prisma.socialProfile.findFirst.mockResolvedValue(
      profile({ id: ME_PROFILE_ID, userId: ACTOR_ID, username: 'musteri' }),
    );

    const code = await codeOfRejection(() => service.follow(actor, 'musteri'));
    expect(code).toBe('VALIDATION_ERROR');
    expect(prisma.follow.create).not.toHaveBeenCalled();
  });

  it('engel varken takip engeller', async () => {
    prisma.userBlock.findFirst.mockResolvedValue({ id: 'block-1' });

    const code = await codeOfRejection(() => service.follow(actor, 'satıcı'));
    expect(code).toBe('FORBIDDEN');
    expect(prisma.follow.create).not.toHaveBeenCalled();
  });
});
