import { Injectable } from '@nestjs/common';
import {
  PostType,
  RequestSource,
  RequestType,
  type CommerceRequest,
  type SocialPost,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { CreateCommerceRequestDto } from '@modules/requests/dto/create-request.dto';
import { RequestsService } from '@modules/requests/requests.service';

import type { CreateRequestFromPostDto, ShareRequestToFeedDto } from './dto/social.dto';
import { PostsService } from './posts.service';
import { ProfilesService } from './profiles.service';
import { postInclude, toSocialPost } from './social.mapper';

@Injectable()
export class SocialBridgeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly posts: PostsService,
    private readonly profiles: ProfilesService,
    private readonly requests: RequestsService,
    private readonly audit: AuditLogService,
  ) {}

  /**
   * Post → CommerceRequest. Social module NEVER writes CommerceRequest via Prisma;
   * always goes through RequestsService.
   */
  async createRequestFromPost(
    user: AuthenticatedUser,
    postId: string,
    overrides: CreateRequestFromPostDto = {},
  ): Promise<CommerceRequest> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: postInclude,
    });
    if (!post) throw AppException.notFound('Gönderi', postId);

    const deal = post.dealMetadata;
    const bodySlice = post.body?.trim().slice(0, 80) ?? '';
    const rawTitle =
      overrides.title?.trim() ||
      deal?.title?.trim() ||
      deal?.productName?.trim() ||
      bodySlice ||
      'Akıştan talep';
    const title = clampText(rawTitle, 5, 160, 'Akıştan talep');

    const rawDescription = overrides.description?.trim() || post.body?.trim() || title;
    const description = clampText(rawDescription, 10, 5000, `${title} — akıştan oluşturuldu`);

    const requestType =
      post.type === PostType.SERVICE_PROMOTION
        ? RequestType.SERVICE
        : RequestType.PRODUCT_SUPPLY;

    const dto: CreateCommerceRequestDto = {
      requestType,
      title,
      description,
      categoryId: deal?.categoryId ?? undefined,
      subcategoryId: deal?.subcategoryId ?? undefined,
      quantity: deal?.minQuantity ?? undefined,
      unit: deal?.unit ?? undefined,
      budgetMinor: deal?.dealPriceMinor ?? deal?.listPriceMinor ?? undefined,
      source: RequestSource.WEB,
      publish: overrides.publish ?? false,
      specifications: {
        sourcePostId: post.id,
        sourceAuthorProfileId: post.authorProfileId,
        brand: deal?.brand ?? null,
        productName: deal?.productName ?? null,
        dealTitle: deal?.title ?? null,
        currency: deal?.currency ?? post.promoCurrency ?? 'TRY',
        listPriceMinor: deal?.listPriceMinor ?? post.originalPriceMinor ?? null,
        dealPriceMinor: deal?.dealPriceMinor ?? post.promoPriceMinor ?? null,
      },
    };

    const created = await this.requests.create(user, dto);

    await this.audit.record({
      actorId: user.id,
      action: 'social.post.create_request',
      entityType: 'CommerceRequest',
      entityId: created.id,
      changes: { postId: post.id, requestId: created.id, publish: dto.publish ?? false },
    });

    return created;
  }

  /**
   * Request → REQUEST_SHARE post. Idempotent per (author profile, requestId).
   */
  async shareRequestToFeed(
    user: AuthenticatedUser,
    requestId: string,
    dto: ShareRequestToFeedDto = {},
  ): Promise<SocialPost> {
    const request = await this.requests.getById(user, requestId);
    if (request.buyerUserId !== user.id) {
      throw AppException.forbiddenResource('Talep', { requestId });
    }

    const author = await this.profiles.ensurePersonalProfile(user.id);

    const existing = await this.prisma.post.findFirst({
      where: {
        authorProfileId: author.id,
        commerceRequestId: requestId,
        type: PostType.REQUEST_SHARE,
        deletedAt: null,
      },
      include: postInclude,
    });
    if (existing) {
      return toSocialPost(existing, this.config.fileBaseUrl);
    }

    const body = dto.body?.trim() || `Talep paylaşımı: ${request.title}`;

    return this.posts.create(user, {
      type: PostType.REQUEST_SHARE,
      body,
      commerceRequestId: requestId,
    });
  }
}

function clampText(value: string, min: number, max: number, fallback: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= min) return trimmed.slice(0, max);
  const padded = (trimmed || fallback).trim();
  if (padded.length >= min) return padded.slice(0, max);
  return fallback.slice(0, max);
}
