import { UserRole } from '@talpio/types';

import type { AppConfigService } from '@config/app-config.service';
import type { FeedCacheService } from '@infra/cache/feed-cache.service';
import type { PrismaReadService } from '@infra/prisma/prisma-read.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { CategoryFollowsService } from './category-follows.service';
import { FeedService } from './feed.service';
import type { ProfilesService } from './profiles.service';

const USER_ID = 'user-1';
const PROFILE_ID = 'profile-1';
const FOLLOWED_PROFILE = 'profile-followed';
const POST_TEXT = '0194a1b2-c3d4-7000-8000-000000000010';
const POST_DEAL = '0194a1b2-c3d4-7000-8000-000000000011';
const FEED_TEXT = 'feed-text';
const FEED_DEAL = 'feed-deal';

const user: AuthenticatedUser = { id: USER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };

function profile(id = PROFILE_ID) {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id,
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
  };
}

function feedRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: FEED_TEXT,
    kind: 'POST',
    postId: POST_TEXT,
    commerceRequestId: null,
    authorProfileId: PROFILE_ID,
    score: 0,
    createdAt: now,
    post: {
      id: POST_TEXT,
      authorProfileId: PROFILE_ID,
      type: 'TEXT',
      body: 'Akışta görünmeli',
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
      author: profile(),
      dealMetadata: null,
      media: [],
    },
    ...overrides,
  };
}

function createService(prisma: unknown, profiles?: ProfilesService) {
  const categoryFollows = {
    followedCategoryIds: jest.fn().mockResolvedValue([]),
  } as unknown as CategoryFollowsService;

  const feedCache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    bumpUserVersion: jest.fn(),
    getUserVersion: jest.fn(),
  };

  return new FeedService(
    prisma as unknown as PrismaReadService,
    feedCache as unknown as FeedCacheService,
    {
      fileBaseUrl: 'http://localhost:9000/x',
      storyTtlHours: 24,
    } as unknown as AppConfigService,
    profiles ??
      ({
        ensurePersonalProfile: jest.fn().mockResolvedValue(profile()),
      } as unknown as ProfilesService),
    categoryFollows,
  );
}

function basePrisma(overrides: Record<string, unknown> = {}) {
  return {
    follow: { findMany: jest.fn().mockResolvedValue([]) },
    userBlock: { findMany: jest.fn().mockResolvedValue([]) },
    socialProfile: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ locationCityId: null }),
    },
    businessMembership: { findMany: jest.fn().mockResolvedValue([]) },
    postHide: { findMany: jest.fn().mockResolvedValue([]) },
    postView: { findMany: jest.fn().mockResolvedValue([]) },
    postShare: { findMany: jest.fn().mockResolvedValue([]) },
    commerceRequest: { findMany: jest.fn().mockResolvedValue([]) },
    requestOffer: { findMany: jest.fn().mockResolvedValue([]) },
    feedItem: {
      findMany: jest.fn().mockResolvedValue([feedRow()]),
      findUnique: jest.fn(),
    },
    postLike: { findMany: jest.fn().mockResolvedValue([]) },
    savedPost: { findMany: jest.fn().mockResolvedValue([]) },
    post: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  };
}

describe('FeedService', () => {
  it('takip yoksa genel havuzu konum/keşfet gibi doldurur', async () => {
    const prisma = basePrisma();
    const page = await createService(prisma).getHomeFeed(user, { limit: 20 });

    expect(prisma.feedItem.findMany).toHaveBeenCalled();
    expect(page.items.length).toBeGreaterThan(0);
    const where = (prisma.feedItem.findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> })
      .where;
    expect(where.authorProfileId).not.toEqual({ in: [] });
  });

  it('takip edilen yazarları havuzdan çıkarmaz, sıralamada öne alır', async () => {
    const prisma = basePrisma({
      follow: {
        findMany: jest.fn().mockResolvedValue([{ followingProfileId: FOLLOWED_PROFILE }]),
      },
      feedItem: {
        findMany: jest.fn().mockResolvedValue([
          feedRow({
            id: FEED_DEAL,
            postId: POST_DEAL,
            authorProfileId: FOLLOWED_PROFILE,
            post: {
              ...feedRow().post,
              id: POST_DEAL,
              authorProfileId: FOLLOWED_PROFILE,
              body: 'Takip edilen mağaza',
              author: profile(FOLLOWED_PROFILE),
            },
          }),
        ]),
        findUnique: jest.fn(),
      },
    });

    const page = await createService(prisma).getHomeFeed(user, { limit: 20 });

    const where = (prisma.feedItem.findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> })
      .where;
    expect(where.authorProfileId).toEqual({ notIn: [PROFILE_ID] });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.post?.body).toBe('Takip edilen mağaza');
  });

  it('keşfette takip edilen yazarları ve kendi profili hariç tutar', async () => {
    const prisma = basePrisma({
      follow: {
        findMany: jest.fn().mockResolvedValue([{ followingProfileId: FOLLOWED_PROFILE }]),
      },
      feedItem: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    });

    const categoryFollows = {
      followedCategoryIds: jest.fn().mockResolvedValue(['cat-1']),
    };

    await new FeedService(
      prisma as unknown as PrismaReadService,
      {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        bumpUserVersion: jest.fn(),
        getUserVersion: jest.fn(),
      } as unknown as FeedCacheService,
      { fileBaseUrl: 'http://localhost:9000/x', storyTtlHours: 24 } as unknown as AppConfigService,
      {
        ensurePersonalProfile: jest.fn().mockResolvedValue(profile()),
      } as unknown as ProfilesService,
      categoryFollows as unknown as CategoryFollowsService,
    ).getDiscoverFeed(user, { limit: 20 });

    const where = (prisma.feedItem.findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> })
      .where;
    expect(where.authorProfileId).toEqual({ notIn: [PROFILE_ID] });
    const post = where.post as { AND: Array<Record<string, unknown>> };
    expect(post.AND).toEqual(
      expect.arrayContaining([{ authorProfileId: { notIn: [FOLLOWED_PROFILE] } }]),
    );
    expect(post.AND).not.toEqual(
      expect.arrayContaining([{ dealMetadata: { categoryId: { in: ['cat-1'] } } }]),
    );
  });

  it('hikâyelerde takip edilenleri ve aynı şehirdeki herkese açık görselleri ister', async () => {
    const prisma = basePrisma({
      follow: {
        findMany: jest.fn().mockResolvedValue([{ followingProfileId: FOLLOWED_PROFILE }]),
      },
      post: {
        findMany: jest.fn().mockResolvedValue([
          {
            ...feedRow().post,
            id: POST_DEAL,
            authorProfileId: FOLLOWED_PROFILE,
            media: [
              {
                file: {
                  id: 'file-1',
                  storageKey: 'https://images.example.com/story.jpg',
                  mimeType: 'image/jpeg',
                  sizeBytes: 1200,
                  originalName: 'story.jpg',
                  isPublic: true,
                  createdAt: new Date('2026-08-01T10:00:00.000Z'),
                },
              },
            ],
            author: profile(FOLLOWED_PROFILE),
            dealMetadata: null,
            hashtags: [],
            mentions: [],
            originalPost: null,
          },
        ]),
      },
    });

    const page = await createService(prisma).listStories(user);
    const where = (prisma.post.findMany.mock.calls[0]?.[0] as { where: Record<string, unknown> })
      .where;

    expect(where.OR).toEqual(
      expect.arrayContaining([{ authorProfileId: { in: [PROFILE_ID, FOLLOWED_PROFILE] } }]),
    );
    expect(where.media).toEqual({ some: {} });
    expect(page.comingSoon).toBe(false);
    expect(page.items[0]?.media[0]?.url).toBe('https://images.example.com/story.jpg');
  });
});
