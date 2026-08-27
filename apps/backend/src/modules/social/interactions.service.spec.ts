import { UserRole } from '@talpio/types';

import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { InteractionsService } from './interactions.service';
import type { ProfilesService } from './profiles.service';

const USER_ID = 'user-1';
const AUTHOR_USER_ID = 'user-2';
const PROFILE_ID = 'profile-1';
const POST_ID = '0194a1b2-c3d4-7000-8000-000000000010';

const user: AuthenticatedUser = { id: USER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };

function profile(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: PROFILE_ID,
    kind: 'PERSONAL',
    userId: USER_ID,
    businessId: null,
    username: 'musteri',
    displayName: 'Ayşe',
    bio: null,
    avatarFileId: null,
    coverFileId: null,
    locationCityId: null,
    locationText: null,
    followerCount: 0,
    followingCount: 0,
    postCount: 1,
    isVerifiedDisplay: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    avatar: null,
    cover: null,
    ...overrides,
  };
}

function postRow() {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: POST_ID,
    authorProfileId: 'author-profile',
    type: 'TEXT',
    body: 'Merhaba',
    visibility: 'PUBLIC',
    likeCount: 1,
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
    dealMetadata: null,
    commerceRequestId: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    author: profile({ id: 'author-profile', userId: AUTHOR_USER_ID, username: 'satıcı' }),
    media: [],
  };
}

function postMeta() {
  return {
    id: POST_ID,
    body: 'Merhaba',
    author: { userId: AUTHOR_USER_ID },
  };
}

type PrismaMock = {
  post: { findFirst: jest.Mock; update: jest.Mock };
  postLike: { findUnique: jest.Mock; create: jest.Mock; delete: jest.Mock };
  savedPost: { findUnique: jest.Mock };
  postShare: { findUnique: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    post: {
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    postLike: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'like-1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    savedPost: { findUnique: jest.fn().mockResolvedValue(null) },
    postShare: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn(),
  };
  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));
  return mock;
}

function createService(prisma: PrismaMock) {
  const profiles = {
    ensurePersonalProfile: jest.fn().mockResolvedValue(profile()),
  } as unknown as ProfilesService;
  const notifications = { dispatch: jest.fn().mockResolvedValue(undefined) };
  const config = { fileBaseUrl: 'http://localhost:9000/x' } as unknown as AppConfigService;

  return new InteractionsService(
    prisma as unknown as PrismaService,
    config,
    profiles,
    notifications as never,
    { postUpdated: jest.fn() } as never,
  );
}

describe('InteractionsService', () => {
  let prisma: PrismaMock;
  let service: InteractionsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  it('beğeni idempotenttir: ikinci çağrıda sayaç artmaz', async () => {
    prisma.post.findFirst
      .mockResolvedValueOnce(postMeta())
      .mockResolvedValueOnce(postRow())
      .mockResolvedValueOnce(postMeta())
      .mockResolvedValueOnce(postRow());

    await service.like(user, POST_ID);
    expect(prisma.postLike.create).toHaveBeenCalledTimes(1);

    prisma.postLike.findUnique.mockResolvedValue({ id: 'like-1' });
    await service.like(user, POST_ID);
    expect(prisma.postLike.create).toHaveBeenCalledTimes(1);
  });

  it('unlike mevcut beğeniyi kaldırır', async () => {
    prisma.postLike.findUnique
      .mockResolvedValueOnce({ id: 'like-1' })
      .mockResolvedValueOnce({ id: 'like-1' })
      .mockResolvedValue(null);
    prisma.post.findFirst.mockResolvedValueOnce(postMeta()).mockResolvedValueOnce(postRow());

    await service.unlike(user, POST_ID);

    expect(prisma.postLike.delete).toHaveBeenCalledWith({ where: { id: 'like-1' } });
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: POST_ID },
      data: { likeCount: { decrement: 1 } },
    });
  });
});
