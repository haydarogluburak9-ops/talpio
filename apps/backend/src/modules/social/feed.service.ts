import { Injectable } from '@nestjs/common';
import { PostVisibility, type FeedItem, type SocialPost } from '@talpio/types';

import type { CursorMeta } from '@common/dto/api-response.dto';
import { AppConfigService } from '@config/app-config.service';
import type { Prisma } from '@/generated/prisma/client';
import { FeedCacheService } from '@infra/cache/feed-cache.service';
import { PrismaReadService } from '@infra/prisma/prisma-read.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { CategoryFollowsService } from './category-follows.service';
import type { DiscoverFeedQueryDto, FeedQueryDto } from './dto/social.dto';
import { computeFeedScore, parseStockQuantity } from './feed-ranking';
import { ProfilesService } from './profiles.service';
import { feedItemInclude, postInclude, toFeedItem, toSocialPost } from './social.mapper';

export interface FeedPage {
  items: FeedItem[];
  meta: CursorMeta;
}

@Injectable()
export class FeedService {
  constructor(
    private readonly read: PrismaReadService,
    private readonly feedCache: FeedCacheService,
    private readonly config: AppConfigService,
    private readonly profiles: ProfilesService,
    private readonly categoryFollows: CategoryFollowsService,
  ) {}

  /**
   * Ana akış: takip yoksa konum / ilgi ile keşfet gibi dolar.
   * Takip arttıkça takip edilen yazarlar sıralamada öne çıkar.
   */
  async getHomeFeed(user: AuthenticatedUser, query: FeedQueryDto): Promise<FeedPage> {
    const cached = await this.feedCache.get<FeedPage>('home', user.id, query.cursor, query.limit);
    if (cached) return cached;

    const me = await this.profiles.ensurePersonalProfile(user.id);
    const context = await this.viewerContext(user.id, me.id);
    const visibilityFilter = this.buildVisibilityFilter(context);
    const excludedAuthors = [...context.blockedProfileIds, me.id];

    const where: Prisma.FeedItemWhereInput = {
      kind: 'POST',
      postId: { not: null },
      post: visibilityFilter,
      ...(excludedAuthors.length ? { authorProfileId: { notIn: excludedAuthors } } : {}),
      ...(query.cursor ? { createdAt: { lt: await this.cursorCreatedAt(query.cursor) } } : {}),
    };

    const page = await this.rankAndPage(me.id, where, query.limit, context);
    await this.feedCache.set('home', user.id, query.cursor, query.limit, page);
    return page;
  }

  /**
   * Hikâyeler: kullanıcının ve takip ettiği profillerin son 24 saatteki
   * görselli gönderileri. Ayrı bir Story tablosu yok; mevcut post medyası.
   */
  async listStories(user: AuthenticatedUser): Promise<{ items: SocialPost[]; comingSoon: false }> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const following = await this.read.follow.findMany({
      where: { followerProfileId: me.id },
      select: { followingProfileId: true },
    });
    const authorIds = [me.id, ...following.map((row) => row.followingProfileId)];
    const since = new Date(Date.now() - this.config.storyTtlHours * 60 * 60 * 1000);
    const cityId = (
      await this.read.socialProfile.findFirst({
        where: { id: me.id },
        select: { locationCityId: true },
      })
    )?.locationCityId;

    const scoped = await this.read.post.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: since },
        media: { some: {} },
        OR: [
          { authorProfileId: { in: authorIds } },
          {
            visibility: PostVisibility.PUBLIC,
            ...(cityId ? { author: { locationCityId: cityId } } : {}),
          },
        ],
        visibility: { in: [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS] },
      },
      include: postInclude,
      orderBy: { createdAt: 'asc' },
      take: 80,
    });

    const rows =
      scoped.length > 0
        ? scoped
        : await this.read.post.findMany({
            where: {
              deletedAt: null,
              createdAt: { gte: since },
              media: { some: {} },
              visibility: PostVisibility.PUBLIC,
            },
            include: postInclude,
            orderBy: { createdAt: 'desc' },
            take: 24,
          });

    const followingSet = new Set(following.map((row) => row.followingProfileId));
    return {
      items: rows.map((row) =>
        toSocialPost(row, this.config.fileBaseUrl, { followedProfileIds: followingSet }),
      ),
      comingSoon: false,
    };
  }

  /**
   * Keşfet: takip edilmeyen hesapların gönderileri.
   * Sıralama kayıt ilgi alanları + beğeni / görüntüleme / takip benzerliğine göre.
   * Kategoriye kilitlenmez; sinyal yoksa popüler genel havuz gelir.
   */
  async getDiscoverFeed(user: AuthenticatedUser, query: DiscoverFeedQueryDto): Promise<FeedPage> {
    const cached = await this.feedCache.get<FeedPage>('discover', user.id, query.cursor, query.limit);
    if (cached) return cached;

    const me = await this.profiles.ensurePersonalProfile(user.id);
    const context = await this.viewerContext(user.id, me.id);

    const postFilter: Prisma.PostWhereInput = {
      deletedAt: null,
      AND: [
        {
          OR: [
            { visibility: PostVisibility.PUBLIC },
            ...(context.followedCategoryIds.length
              ? [
                  {
                    visibility: PostVisibility.CATEGORY_TARGETED,
                    dealMetadata: { categoryId: { in: context.followedCategoryIds } },
                  },
                ]
              : []),
            ...(context.businessIds.length ? [{ visibility: PostVisibility.B2B_TARGETED }] : []),
          ],
        },
        ...(context.followingIds.length
          ? [{ authorProfileId: { notIn: context.followingIds } }]
          : []),
      ],
    };

    const excludedAuthors = [...context.blockedProfileIds, me.id];

    const where: Prisma.FeedItemWhereInput = {
      kind: 'POST',
      postId: { not: null },
      post: postFilter,
      ...(excludedAuthors.length ? { authorProfileId: { notIn: excludedAuthors } } : {}),
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
        ...(query.cursor ? { lt: await this.cursorCreatedAt(query.cursor) } : {}),
      },
    };

    const page = await this.rankAndPage(me.id, where, query.limit, context);
    await this.feedCache.set('discover', user.id, query.cursor, query.limit, page);
    return page;
  }

  private buildVisibilityFilter(context: ViewerContext): Prisma.PostWhereInput {
    return {
      deletedAt: null,
      OR: [
        { visibility: PostVisibility.PUBLIC },
        ...(context.followingIds.length
          ? [
              {
                visibility: PostVisibility.FOLLOWERS,
                authorProfileId: { in: context.followingIds },
              },
            ]
          : []),
        ...(context.followedCategoryIds.length
          ? [
              {
                visibility: PostVisibility.CATEGORY_TARGETED,
                dealMetadata: { categoryId: { in: context.followedCategoryIds } },
              },
            ]
          : []),
        ...(context.businessIds.length ? [{ visibility: PostVisibility.B2B_TARGETED }] : []),
      ],
    };
  }

  private async rankAndPage(
    profileId: string,
    where: Prisma.FeedItemWhereInput,
    limit: number,
    context: ViewerContext,
  ): Promise<FeedPage> {
    const fetchTake = Math.min(100, Math.max(limit * 5, limit + 1));
    const rows = await this.read.feedItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: fetchTake,
      include: feedItemInclude,
    });

    const followingSet = new Set(context.followingIds);
    const categorySet = new Set(context.followedCategoryIds);
    const likedCats = new Set(context.likedCategoryIds);
    const viewedCats = new Set(context.viewedCategoryIds);
    const similarAuthors = new Set(context.similarAuthorIds);
    const requestCats = new Set(context.requestCategoryIds);
    const offerCats = new Set(context.offerCategoryIds);
    const saveCats = new Set(context.savedCategoryIds);
    const hidden = new Set(context.hiddenPostIds);
    const seen = new Set(context.seenPostIds);
    const now = new Date();

    const scored = rows
      .filter((row) => !row.postId || !hidden.has(row.postId))
      .map((row) => {
        const post = row.post;
        const categoryId = post?.dealMetadata?.categoryId ?? null;
        const stock = parseStockQuantity(post?.dealMetadata?.stockQuantity);
        const score = post
          ? computeFeedScore({
              authorFollowed: Boolean(row.authorProfileId && followingSet.has(row.authorProfileId)),
              categoryFollowed: Boolean(categoryId && categorySet.has(categoryId)),
              likedCategoryMatch: Boolean(categoryId && likedCats.has(categoryId)),
              viewedCategoryMatch: Boolean(categoryId && viewedCats.has(categoryId)),
              similarAuthor: Boolean(
                row.authorProfileId && similarAuthors.has(row.authorProfileId),
              ),
              type: post.type,
              hasDealMetadata: post.dealMetadata != null,
              dealEndsAt: post.dealMetadata?.endsAt ?? post.promoValidUntil ?? null,
              likeCount: post.likeCount,
              commentCount: post.commentCount,
              saveCount: post.saveCount,
              shareCount: post.shareCount,
              repostCount: post.repostCount,
              createdAt: post.createdAt,
              now,
              locationMatch: Boolean(
                context.locationCityId && post.author?.locationCityId === context.locationCityId,
              ),
              requestCategoryMatch: Boolean(categoryId && requestCats.has(categoryId)),
              offerCategoryMatch: Boolean(categoryId && offerCats.has(categoryId)),
              saveCategoryMatch: Boolean(categoryId && saveCats.has(categoryId)),
              authorIsBusiness: post.author?.kind === 'BUSINESS',
              stockExhausted: stock != null && stock <= 0,
              alreadySeen: Boolean(row.postId && seen.has(row.postId)),
            })
          : 0;
        return { row, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.row.createdAt.getTime() - a.row.createdAt.getTime();
      });

    const pageScored = scored.slice(0, limit);
    const hasMore = scored.length > limit || rows.length >= fetchTake;
    const postIds = pageScored
      .map((s) => s.row.postId)
      .filter((id): id is string => typeof id === 'string');

    const flags = await this.viewerFlags(profileId, postIds);
    const items = pageScored.map(({ row, score }) =>
      toFeedItem(row, this.config.fileBaseUrl, {
        likedByMe: row.postId ? flags.liked.has(row.postId) : false,
        savedByMe: row.postId ? flags.saved.has(row.postId) : false,
        sharedByMe: row.postId ? flags.shared.has(row.postId) : false,
        score,
        followedProfileIds: followingSet,
      }),
    );

    const last = pageScored[pageScored.length - 1]?.row;
    return {
      items,
      meta: {
        nextCursor: hasMore && last ? last.id : null,
        hasNextPage: hasMore && pageScored.length >= limit,
      },
    };
  }

  private async viewerContext(userId: string, profileId: string): Promise<ViewerContext> {
    const me = await this.read.socialProfile.findFirst({
      where: { id: profileId },
      select: { locationCityId: true },
    });

    const [
      following,
      followedCategoryIds,
      blockedUserIds,
      memberships,
      hides,
      views,
      likes,
      requests,
      offers,
      saves,
    ] = await Promise.all([
      this.read.follow.findMany({
        where: { followerProfileId: profileId },
        select: { followingProfileId: true },
      }),
      this.categoryFollows.followedCategoryIds(profileId),
      this.blockedUserIds(userId),
      this.read.businessMembership.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { businessId: true },
      }),
      this.read.postHide.findMany({
        where: { profileId },
        select: { postId: true },
      }),
      this.read.postView.findMany({
        where: { profileId },
        select: {
          postId: true,
          post: {
            select: {
              authorProfileId: true,
              dealMetadata: { select: { categoryId: true } },
            },
          },
        },
        take: 80,
        orderBy: { createdAt: 'desc' },
      }),
      this.read.postLike.findMany({
        where: { profileId },
        select: {
          post: {
            select: {
              authorProfileId: true,
              dealMetadata: { select: { categoryId: true } },
            },
          },
        },
        take: 80,
        orderBy: { createdAt: 'desc' },
      }),
      this.read.commerceRequest.findMany({
        where: { buyerUserId: userId, deletedAt: null, categoryId: { not: null } },
        select: { categoryId: true },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.read.requestOffer.findMany({
        where: { createdByUserId: userId, deletedAt: null },
        select: { request: { select: { categoryId: true } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.read.savedPost.findMany({
        where: { profileId },
        select: { post: { select: { dealMetadata: { select: { categoryId: true } } } } },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const followingIds = following.map((f) => f.followingProfileId);
    const followedBusinesses = followingIds.length
      ? await this.read.socialProfile.findMany({
          where: { id: { in: followingIds }, businessId: { not: null } },
          select: { business: { select: { categories: { select: { categoryId: true } } } } },
        })
      : [];

    const blockedProfileIds = blockedUserIds.length
      ? (
          await this.read.socialProfile.findMany({
            where: { userId: { in: blockedUserIds }, deletedAt: null },
            select: { id: true },
          })
        ).map((p) => p.id)
      : [];

    const likedCategoryIds = likes
      .map((row) => row.post?.dealMetadata?.categoryId)
      .filter((id): id is string => Boolean(id));
    const viewedCategoryIds = views
      .map((row) => row.post?.dealMetadata?.categoryId)
      .filter((id): id is string => Boolean(id));
    const similarAuthorIds = [
      ...likes.map((row) => row.post?.authorProfileId),
      ...views.map((row) => row.post?.authorProfileId),
    ].filter((id): id is string => Boolean(id));
    const followedBusinessCategoryIds = followedBusinesses.flatMap(
      (row) => row.business?.categories.map((item) => item.categoryId) ?? [],
    );

    return {
      followingIds,
      followedCategoryIds,
      likedCategoryIds: [...new Set([...likedCategoryIds, ...followedBusinessCategoryIds])],
      viewedCategoryIds: [...new Set(viewedCategoryIds)],
      similarAuthorIds: [...new Set(similarAuthorIds)],
      blockedProfileIds,
      businessIds: memberships.map((m) => m.businessId),
      locationCityId: me?.locationCityId ?? null,
      hiddenPostIds: hides.map((h) => h.postId),
      seenPostIds: views.map((v) => v.postId),
      requestCategoryIds: requests
        .map((r) => r.categoryId)
        .filter((id): id is string => Boolean(id)),
      offerCategoryIds: offers
        .map((o) => o.request?.categoryId)
        .filter((id): id is string => Boolean(id)),
      savedCategoryIds: saves
        .map((s) => s.post?.dealMetadata?.categoryId)
        .filter((id): id is string => Boolean(id)),
    };
  }

  private async cursorCreatedAt(cursorId: string): Promise<Date> {
    const row = await this.read.feedItem.findUnique({
      where: { id: cursorId },
      select: { createdAt: true },
    });
    return row?.createdAt ?? new Date();
  }

  private async blockedUserIds(userId: string): Promise<string[]> {
    const rows = await this.read.userBlock.findMany({
      where: {
        OR: [{ blockerUserId: userId }, { blockedUserId: userId }],
      },
      select: { blockerUserId: true, blockedUserId: true },
    });

    const ids = new Set<string>();
    for (const row of rows) {
      if (row.blockerUserId !== userId) ids.add(row.blockerUserId);
      if (row.blockedUserId !== userId) ids.add(row.blockedUserId);
    }
    return [...ids];
  }

  private async viewerFlags(profileId: string, postIds: string[]) {
    const liked = new Set<string>();
    const saved = new Set<string>();
    const shared = new Set<string>();
    if (postIds.length === 0) return { liked, saved, shared };

    const [likes, saves, shares] = await Promise.all([
      this.read.postLike.findMany({
        where: { profileId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.read.savedPost.findMany({
        where: { profileId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.read.postShare.findMany({
        where: { profileId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    for (const like of likes) liked.add(like.postId);
    for (const save of saves) saved.add(save.postId);
    for (const share of shares) shared.add(share.postId);
    return { liked, saved, shared };
  }
}

interface ViewerContext {
  followingIds: string[];
  followedCategoryIds: string[];
  likedCategoryIds: string[];
  viewedCategoryIds: string[];
  similarAuthorIds: string[];
  blockedProfileIds: string[];
  businessIds: string[];
  locationCityId: string | null;
  hiddenPostIds: string[];
  seenPostIds: string[];
  requestCategoryIds: string[];
  offerCategoryIds: string[];
  savedCategoryIds: string[];
}
