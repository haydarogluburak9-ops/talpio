import { Injectable } from '@nestjs/common';
import { computeDiscountPercent } from '@talpio/business-logic';
import { deepLinks } from '@talpio/config';
import {
  FeedItemKind,
  NotificationType,
  PostType,
  PostVisibility,
  type SocialPost,
} from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { RbacService } from '@modules/rbac/rbac.service';

import type { CreatePostDto, DealMetadataDto, ListSocialQueryDto } from './dto/social.dto';
import { SocialGraphService } from './graph.service';
import { normalizeHashtag } from './hashtag.util';
import { postTabWhere } from './post-tabs';
import { ProfilesService } from './profiles.service';
import { SocialRealtimeService } from './social-realtime.service';
import { postInclude, toSocialPost } from './social.mapper';

const DEAL_PRICE_TYPES = new Set<string>([
  PostType.DEAL,
  PostType.SPECIAL_PRICE,
  PostType.DISCOUNT,
]);

const CAMPAIGN_NOTIFY_TYPES = new Set<string>([
  PostType.DEAL,
  PostType.CAMPAIGN,
  PostType.SPECIAL_PRICE,
  PostType.DISCOUNT,
  PostType.BULK_PRICE,
  PostType.LIMITED_STOCK,
  PostType.CLEARANCE,
  PostType.SERVICE_PROMOTION,
  PostType.B2B_CAMPAIGN,
  PostType.NEW_PRODUCT,
]);

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
    private readonly profiles: ProfilesService,
    private readonly rbac: RbacService,
    private readonly notifications: NotificationsService,
    private readonly graph: SocialGraphService,
    private readonly realtime: SocialRealtimeService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreatePostDto): Promise<SocialPost> {
    const mediaFileIds = dto.mediaFileIds ?? [];
    const body = dto.body?.trim() ?? '';
    let originalPostId = dto.originalPostId ?? null;

    if (!body && mediaFileIds.length === 0 && !originalPostId) {
      throw new AppException('VALIDATION_ERROR', { message: 'Boş gönderi paylaşılamaz.' });
    }

    const dealInput = this.normalizeDealInput(dto);
    this.assertDealRequirements(dto.type, dealInput);

    await this.files.assertOwnedBy(user.id, mediaFileIds);
    const author = dto.businessId
      ? await this.resolveBusinessAuthor(user.id, dto.businessId)
      : await this.profiles.ensurePersonalProfile(user.id);

    const mediaRows =
      mediaFileIds.length > 0
        ? await this.prisma.fileAsset.findMany({
            where: { id: { in: mediaFileIds } },
            select: { id: true, mimeType: true },
          })
        : [];
    const hasVideo = mediaRows.some((file) => file.mimeType.startsWith('video/'));
    const hasPromoLegacy =
      Boolean(dto.promoLabel?.trim()) ||
      dto.promoPriceMinor !== undefined ||
      dto.originalPriceMinor !== undefined;
    /** Nested `deal` → DEAL; legacy promo alone keeps CAMPAIGN. */
    const hasStructuredDeal = dto.deal != null;

    const type = originalPostId
      ? body
        ? PostType.QUOTE
        : PostType.REPOST
      : this.resolveType(
          dto.type,
          mediaFileIds.length,
          hasVideo,
          hasPromoLegacy,
          hasStructuredDeal,
        );

    const promoLabel =
      dealInput?.title?.trim() || dealInput?.productName?.trim() || dto.promoLabel?.trim() || null;
    const originalPriceMinor = dealInput?.listPriceMinor ?? dto.originalPriceMinor ?? null;
    const promoPriceMinor = dealInput?.dealPriceMinor ?? dto.promoPriceMinor ?? null;
    const promoCurrency =
      dealInput != null || hasPromoLegacy
        ? (dealInput?.currency ?? dto.promoCurrency?.toUpperCase() ?? 'TRY')
        : null;
    const promoValidUntil = dealInput?.endsAt
      ? new Date(dealInput.endsAt)
      : dto.promoValidUntil
        ? new Date(dto.promoValidUntil)
        : null;

    if (originalPostId) {
      const original = await this.prisma.post.findFirst({
        where: { id: originalPostId, deletedAt: null },
        select: { id: true, authorProfileId: true, originalPostId: true, type: true },
      });
      if (!original) throw AppException.notFound('Gönderi', originalPostId);
      if (original.type === PostType.REPOST && original.originalPostId) {
        originalPostId = original.originalPostId;
      }

      if (type === PostType.REPOST) {
        const existing = await this.prisma.post.findFirst({
          where: {
            authorProfileId: author.id,
            originalPostId,
            type: PostType.REPOST,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (existing) {
          throw new AppException('VALIDATION_ERROR', {
            message: 'Bu gönderiyi zaten yeniden paylaştınız.',
          });
        }
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          authorProfileId: author.id,
          type,
          body: body || null,
          visibility: PostVisibility.PUBLIC,
          commerceRequestId: dto.commerceRequestId ?? null,
          originalPostId,
          promoLabel,
          originalPriceMinor,
          promoPriceMinor,
          promoCurrency,
          promoValidUntil,
          media: {
            create: mediaFileIds.map((fileId, index) => ({
              fileId,
              sortOrder: index,
            })),
          },
          ...(dealInput
            ? {
                dealMetadata: {
                  create: {
                    productName: dealInput.productName?.trim() || null,
                    title: dealInput.title?.trim() || null,
                    listPriceMinor: dealInput.listPriceMinor ?? null,
                    dealPriceMinor: dealInput.dealPriceMinor ?? null,
                    discountPercent: computeDiscountPercent(
                      dealInput.listPriceMinor ?? null,
                      dealInput.dealPriceMinor ?? null,
                    ),
                    currency: (dealInput.currency ?? 'TRY').toUpperCase(),
                    unit: dealInput.unit?.trim() || null,
                    minQuantity: dealInput.minQuantity?.trim() || null,
                    maxQuantity: dealInput.maxQuantity?.trim() || null,
                    stockQuantity: dealInput.stockQuantity?.trim() || null,
                    startsAt: dealInput.startsAt ? new Date(dealInput.startsAt) : null,
                    endsAt: dealInput.endsAt ? new Date(dealInput.endsAt) : null,
                    vatIncluded: dealInput.vatIncluded ?? null,
                    shippingIncluded: dealInput.shippingIncluded ?? null,
                    locationText: dealInput.locationText?.trim() || null,
                    categoryId: dealInput.categoryId ?? null,
                    subcategoryId: dealInput.subcategoryId ?? null,
                    brand: dealInput.brand?.trim() || null,
                    deliveryRegions: dealInput.deliveryRegions ?? [],
                  },
                },
              }
            : {}),
        },
        include: postInclude,
      });

      const mentions = await this.graph.attachBodyEntities(tx, post.id, body || null, author.id);

      if (originalPostId && type === PostType.REPOST) {
        await tx.post.update({
          where: { id: originalPostId },
          data: { repostCount: { increment: 1 } },
        });
      }

      await tx.feedItem.create({
        data: {
          kind: FeedItemKind.POST,
          postId: post.id,
          authorProfileId: author.id,
        },
      });

      await tx.socialProfile.update({
        where: { id: author.id },
        data: { postCount: { increment: 1 } },
      });

      return { post, mentionedUserIds: mentions.mentionedUserIds };
    });

    const mapped = toSocialPost(created.post, this.config.fileBaseUrl);
    if (created.post.dealMetadata?.id) {
      const deal = created.post.dealMetadata;
      await this.prisma.priceHistory.create({
        data: {
          dealMetadataId: deal.id,
          postId: created.post.id,
          businessId: author.businessId ?? null,
          listPriceMinor: deal.listPriceMinor,
          dealPriceMinor: deal.dealPriceMinor,
          currency: deal.currency,
        },
      });
    }
    void this.notifyFollowersOfCampaign(mapped, author.id);
    void this.notifyMentions(created.mentionedUserIds, mapped, author.displayName);
    void this.realtime.postCreated(user.id, mapped.id, author.id);
    return mapped;
  }

  private async resolveBusinessAuthor(userId: string, businessId: string) {
    await this.rbac.assertBusinessAccess(userId, businessId);
    return this.profiles.ensureBusinessProfile(businessId, userId);
  }

  private async notifyFollowersOfCampaign(
    post: SocialPost,
    authorProfileId: string,
  ): Promise<void> {
    if (!CAMPAIGN_NOTIFY_TYPES.has(post.type)) return;

    const follows = await this.prisma.follow.findMany({
      where: { followingProfileId: authorProfileId },
      select: {
        follower: { select: { userId: true } },
      },
      take: 500,
    });

    const userIds = [
      ...new Set(
        follows
          .map((row) => row.follower.userId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0),
      ),
    ];
    if (userIds.length === 0) return;

    const title =
      post.deal?.title?.trim() ||
      post.deal?.productName?.trim() ||
      post.promo?.label?.trim() ||
      'Yeni kampanya';
    const message =
      post.body?.trim().slice(0, 160) ||
      `${post.author?.displayName ?? 'Mağaza'} yeni bir fırsat paylaştı.`;

    await this.notifications.dispatchAll(
      userIds.map((userId) => ({
        userId,
        type: NotificationType.CAMPAIGN,
        params: { title, message },
        deepLink: deepLinks.socialPost(post.id),
      })),
    );
  }

  private async notifyMentions(
    userIds: string[],
    post: SocialPost,
    actorName: string,
  ): Promise<void> {
    if (userIds.length === 0) return;
    await this.notifications.dispatchAll(
      userIds.map((userId) => ({
        userId,
        type: NotificationType.SOCIAL_MENTION,
        params: {
          actorName,
          preview: (post.body ?? '').slice(0, 80) || 'Gönderi',
        },
        deepLink: deepLinks.socialPost(post.id),
      })),
    );
  }

  async getById(id: string, viewerUserId?: string): Promise<SocialPost> {
    const row = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: postInclude,
    });
    if (!row) throw AppException.notFound('Gönderi', id);

    const extras = await this.viewerFlags(row.id, viewerUserId);
    return toSocialPost(row, this.config.fileBaseUrl, extras);
  }

  async listByUsername(
    username: string,
    query: ListSocialQueryDto,
    viewerUserId?: string,
  ): Promise<PaginatedResult<SocialPost>> {
    const profile = await this.prisma.socialProfile.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: { id: true },
    });
    if (!profile) throw AppException.notFound('Profil', username);

    const where = {
      authorProfileId: profile.id,
      deletedAt: null,
      ...postTabWhere(query.tab),
    };
    const [rows, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: postInclude,
      }),
      this.prisma.post.count({ where }),
    ]);

    const flags = await this.viewerFlagsMany(
      rows.map((r) => r.id),
      viewerUserId,
    );

    return PaginatedResult.of(
      rows.map((row) =>
        toSocialPost(row, this.config.fileBaseUrl, {
          likedByMe: flags.liked.has(row.id),
          savedByMe: flags.saved.has(row.id),
          sharedByMe: flags.shared.has(row.id),
        }),
      ),
      total,
      query.page,
      query.limit,
    );
  }

  async listByHashtag(
    slug: string,
    query: ListSocialQueryDto,
    viewerUserId?: string,
  ): Promise<PaginatedResult<SocialPost>> {
    const parsed = normalizeHashtag(slug);
    if (!parsed) {
      return PaginatedResult.of([], 0, query.page, query.limit);
    }

    const hashtag = await this.prisma.hashtag.findUnique({
      where: { slug: parsed.slug },
      select: { id: true },
    });
    if (!hashtag) {
      return PaginatedResult.of([], 0, query.page, query.limit);
    }

    const where = { hashtagId: hashtag.id, post: { deletedAt: null } };
    const [rows, total] = await Promise.all([
      this.prisma.postHashtag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { post: { include: postInclude } },
      }),
      this.prisma.postHashtag.count({ where }),
    ]);

    const posts = rows
      .map((row) => row.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post));
    const flags = await this.viewerFlagsMany(
      posts.map((post) => post.id),
      viewerUserId,
    );

    return PaginatedResult.of(
      posts.map((row) =>
        toSocialPost(row, this.config.fileBaseUrl, {
          likedByMe: flags.liked.has(row.id),
          savedByMe: flags.saved.has(row.id),
          sharedByMe: flags.shared.has(row.id),
        }),
      ),
      total,
      query.page,
      query.limit,
    );
  }

  async listSaved(
    user: AuthenticatedUser,
    query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialPost>> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const where = { profileId: me.id, post: { deletedAt: null } };
    const [rows, total] = await Promise.all([
      this.prisma.savedPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { post: { include: postInclude } },
      }),
      this.prisma.savedPost.count({ where }),
    ]);

    const posts = rows
      .map((row) => row.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post));

    return PaginatedResult.of(
      posts.map((row) => toSocialPost(row, this.config.fileBaseUrl, { savedByMe: true })),
      total,
      query.page,
      query.limit,
    );
  }

  async delete(user: AuthenticatedUser, id: string): Promise<void> {
    const author = await this.profiles.ensurePersonalProfile(user.id);
    const post = await this.prisma.post.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, authorProfileId: true },
    });
    if (!post) throw AppException.notFound('Gönderi', id);

    if (post.authorProfileId !== author.id) {
      throw AppException.forbiddenResource('Gönderi', { postId: id });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await tx.feedItem.deleteMany({ where: { postId: id } });
      await tx.socialProfile.update({
        where: { id: author.id },
        data: { postCount: { decrement: 1 } },
      });
    });
  }

  private normalizeDealInput(dto: CreatePostDto): DealMetadataDto | null {
    if (dto.deal) return dto.deal;

    const hasPromo =
      Boolean(dto.promoLabel?.trim()) ||
      dto.promoPriceMinor !== undefined ||
      dto.originalPriceMinor !== undefined;
    if (!hasPromo) return null;

    // Legacy promo alanlarından DealMetadata üret (dual-write / ranking).
    return {
      title: dto.promoLabel?.trim() || null,
      listPriceMinor: dto.originalPriceMinor ?? null,
      dealPriceMinor: dto.promoPriceMinor ?? null,
      currency: dto.promoCurrency?.toUpperCase() ?? 'TRY',
      endsAt: dto.promoValidUntil ?? null,
    };
  }

  private assertDealRequirements(type: CreatePostDto['type'], deal: DealMetadataDto | null): void {
    if (!type || !DEAL_PRICE_TYPES.has(type)) return;
    const ok = Boolean(
      deal?.dealPriceMinor != null ||
      deal?.listPriceMinor != null ||
      deal?.productName?.trim() ||
      deal?.title?.trim(),
    );
    if (!ok) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Fırsat gönderisi için fiyat veya ürün/başlık gerekli.',
        context: { type },
      });
    }
  }

  private resolveType(
    requested: CreatePostDto['type'],
    mediaCount: number,
    hasVideo: boolean,
    hasPromoLegacy: boolean,
    hasDeal: boolean,
  ): (typeof PostType)[keyof typeof PostType] {
    if (requested && requested !== PostType.TEXT && requested !== PostType.STANDARD) {
      return requested;
    }
    // deal varken TEXT/STANDARD → DEAL
    if (hasDeal) return PostType.DEAL;
    if (hasPromoLegacy) return PostType.CAMPAIGN;
    if (hasVideo && mediaCount === 1) return PostType.VIDEO;
    if (mediaCount > 1) return PostType.MULTI_IMAGE;
    if (mediaCount === 1) return PostType.IMAGE;
    return requested === PostType.STANDARD ? PostType.STANDARD : PostType.TEXT;
  }

  private async viewerFlags(postId: string, viewerUserId?: string) {
    const many = await this.viewerFlagsMany([postId], viewerUserId);
    return {
      likedByMe: many.liked.has(postId),
      savedByMe: many.saved.has(postId),
      sharedByMe: many.shared.has(postId),
    };
  }

  private async viewerFlagsMany(postIds: string[], viewerUserId?: string) {
    const liked = new Set<string>();
    const saved = new Set<string>();
    const shared = new Set<string>();
    if (!viewerUserId || postIds.length === 0) return { liked, saved, shared };

    const profile = await this.prisma.socialProfile.findFirst({
      where: { userId: viewerUserId, deletedAt: null },
      select: { id: true },
    });
    if (!profile) return { liked, saved, shared };

    const [likes, saves, shares] = await Promise.all([
      this.prisma.postLike.findMany({
        where: { profileId: profile.id, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.savedPost.findMany({
        where: { profileId: profile.id, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.postShare.findMany({
        where: { profileId: profile.id, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    for (const like of likes) liked.add(like.postId);
    for (const save of saves) saved.add(save.postId);
    for (const share of shares) shared.add(share.postId);
    return { liked, saved, shared };
  }
}
