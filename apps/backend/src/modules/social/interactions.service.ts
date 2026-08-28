import { Injectable } from '@nestjs/common';
import { deepLinks } from '@talpio/config';
import { NotificationType, type SocialPost, type SocialPostComment } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type { CreateCommentDto, ListSocialQueryDto } from './dto/social.dto';
import { ProfilesService } from './profiles.service';
import { SocialRealtimeService } from './social-realtime.service';
import { commentInclude, postInclude, toSocialComment, toSocialPost } from './social.mapper';

/** Tek istekte kaydedilecek en fazla görüntüleme sayısı. */
const VIEW_BATCH_LIMIT = 100;

@Injectable()
export class InteractionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly profiles: ProfilesService,
    private readonly notifications: NotificationsService,
    private readonly realtime: SocialRealtimeService,
  ) {}

  async like(user: AuthenticatedUser, postId: string): Promise<SocialPost> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const post = await this.requirePost(postId);

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_profileId: { postId, profileId: me.id } },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.postLike.create({ data: { postId, profileId: me.id } });
        await tx.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        });
      });

      if (post.author.userId && post.author.userId !== user.id) {
        await this.notifications.dispatch({
          userId: post.author.userId,
          type: NotificationType.SOCIAL_LIKE,
          params: {
            actorName: me.displayName,
            preview: (post.body ?? '').slice(0, 80) || 'Gönderi',
          },
          deepLink: deepLinks.socialPost(postId),
        });
      }
    }

    const updated = await this.loadPost(postId, me.id);
    void this.realtime.postUpdated(
      postId,
      { postId, likeCount: updated.likeCount, commentCount: updated.commentCount },
      user.id,
      post.author.userId ?? null,
    );
    return updated;
  }

  async unlike(user: AuthenticatedUser, postId: string): Promise<SocialPost> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    await this.requirePost(postId);

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_profileId: { postId, profileId: me.id } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.postLike.delete({ where: { id: existing.id } });
        await tx.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        });
      });
    }

    return this.loadPost(postId, me.id);
  }

  async comment(
    user: AuthenticatedUser,
    postId: string,
    dto: CreateCommentDto,
  ): Promise<SocialPostComment> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const post = await this.requirePost(postId);

    if (dto.parentId) {
      const parent = await this.prisma.postComment.findFirst({
        where: { id: dto.parentId, postId, deletedAt: null },
        select: { id: true, parentId: true },
      });
      if (!parent) throw AppException.notFound('Yorum', dto.parentId);
      if (parent.parentId) {
        throw new AppException('VALIDATION_ERROR', {
          message: 'Yorum yanıtları tek seviye ile sınırlıdır.',
        });
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.postComment.create({
        data: {
          postId,
          authorProfileId: me.id,
          parentId: dto.parentId ?? null,
          body: dto.body.trim(),
        },
        include: commentInclude,
      });
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });
      return row;
    });

    if (post.author.userId && post.author.userId !== user.id) {
      await this.notifications.dispatch({
        userId: post.author.userId,
        type: NotificationType.SOCIAL_COMMENT,
        params: {
          actorName: me.displayName,
          preview: dto.body.trim().slice(0, 80),
        },
        deepLink: deepLinks.socialPost(postId),
      });
    }

    return toSocialComment(created, this.config.fileBaseUrl);
  }

  async listComments(
    postId: string,
    query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialPostComment>> {
    await this.requirePost(postId);
    const where = { postId, deletedAt: null };

    const [rows, total] = await Promise.all([
      this.prisma.postComment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: query.skip,
        take: query.limit,
        include: commentInclude,
      }),
      this.prisma.postComment.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => toSocialComment(row, this.config.fileBaseUrl)),
      total,
      query.page,
      query.limit,
    );
  }

  async save(user: AuthenticatedUser, postId: string): Promise<SocialPost> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    await this.requirePost(postId);

    const existing = await this.prisma.savedPost.findUnique({
      where: { postId_profileId: { postId, profileId: me.id } },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.savedPost.create({ data: { postId, profileId: me.id } });
        await tx.post.update({
          where: { id: postId },
          data: { saveCount: { increment: 1 } },
        });
      });
    }

    return this.loadPost(postId, me.id);
  }

  async unsave(user: AuthenticatedUser, postId: string): Promise<SocialPost> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    await this.requirePost(postId);

    const existing = await this.prisma.savedPost.findUnique({
      where: { postId_profileId: { postId, profileId: me.id } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.savedPost.delete({ where: { id: existing.id } });
        await tx.post.update({
          where: { id: postId },
          data: { saveCount: { decrement: 1 } },
        });
      });
    }

    return this.loadPost(postId, me.id);
  }

  async share(user: AuthenticatedUser, postId: string): Promise<SocialPost> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const post = await this.requirePost(postId);

    const existing = await this.prisma.postShare.findUnique({
      where: { postId_profileId: { postId, profileId: me.id } },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.postShare.create({ data: { postId, profileId: me.id } });
        await tx.post.update({
          where: { id: postId },
          data: { shareCount: { increment: 1 } },
        });
      });

      if (post.author.userId && post.author.userId !== user.id) {
        await this.notifications.dispatch({
          userId: post.author.userId,
          type: NotificationType.SOCIAL_SHARE,
          params: {
            actorName: me.displayName,
            preview: (post.body ?? '').slice(0, 80) || 'Gönderi',
          },
          deepLink: deepLinks.socialPost(postId),
        });
      }
    }

    return this.loadPost(postId, me.id);
  }

  /**
   * Birden çok gönderinin görüntülenmesini tek turda kaydeder.
   *
   * Akış açılırken her kart kendi isteğini attığında otuz kartlık bir sayfa
   * otuz POST demekti ve her biri profil çözümü + doğrulama + transaction
   * çalıştırdığı için akış saniyelerce donuk kalıyordu. Buradaki sorgu sayısı
   * gönderi sayısından bağımsızdır.
   */
  async recordViews(user: AuthenticatedUser, postIds: string[]): Promise<{ recorded: number }> {
    const unique = [...new Set(postIds)].slice(0, VIEW_BATCH_LIMIT);
    if (unique.length === 0) return { recorded: 0 };

    const me = await this.profiles.ensurePersonalProfile(user.id);

    const posts = await this.prisma.post.findMany({
      where: { id: { in: unique }, deletedAt: null },
      select: { id: true },
    });
    if (posts.length === 0) return { recorded: 0 };

    const ids = posts.map((post) => post.id);
    const seen = await this.prisma.postView.findMany({
      where: { profileId: me.id, postId: { in: ids } },
      select: { postId: true },
    });

    const seenIds = new Set(seen.map((row) => row.postId));
    const fresh = ids.filter((id) => !seenIds.has(id));

    await this.prisma.$transaction([
      ...(fresh.length > 0
        ? [
            this.prisma.postView.createMany({
              data: fresh.map((postId) => ({ postId, profileId: me.id })),
              skipDuplicates: true,
            }),
            this.prisma.post.updateMany({
              where: { id: { in: fresh } },
              data: { uniqueViewCount: { increment: 1 } },
            }),
          ]
        : []),
      this.prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { viewCount: { increment: 1 } },
      }),
    ]);

    return { recorded: fresh.length };
  }

  async recordView(user: AuthenticatedUser, postId: string): Promise<{ recorded: boolean }> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    await this.requirePost(postId);

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.postView.create({ data: { postId, profileId: me.id } });
        await tx.post.update({
          where: { id: postId },
          data: { viewCount: { increment: 1 }, uniqueViewCount: { increment: 1 } },
        });
      });
      return { recorded: true };
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002'
      ) {
        await this.prisma.post.update({
          where: { id: postId },
          data: { viewCount: { increment: 1 } },
        });
        return { recorded: false };
      }
      throw error;
    }
  }

  async hide(user: AuthenticatedUser, postId: string): Promise<{ ok: true }> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    await this.requirePost(postId);
    await this.prisma.postHide.upsert({
      where: { postId_profileId: { postId, profileId: me.id } },
      create: { postId, profileId: me.id },
      update: {},
    });
    return { ok: true };
  }

  private async requirePost(postId: string) {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: {
        id: true,
        body: true,
        author: { select: { userId: true } },
      },
    });
    if (!post) throw AppException.notFound('Gönderi', postId);
    return post;
  }

  private async loadPost(postId: string, viewerProfileId: string): Promise<SocialPost> {
    const row = await this.prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      include: postInclude,
    });
    if (!row) throw AppException.notFound('Gönderi', postId);

    const [liked, saved, shared] = await Promise.all([
      this.prisma.postLike.findUnique({
        where: { postId_profileId: { postId, profileId: viewerProfileId } },
        select: { id: true },
      }),
      this.prisma.savedPost.findUnique({
        where: { postId_profileId: { postId, profileId: viewerProfileId } },
        select: { id: true },
      }),
      this.prisma.postShare.findUnique({
        where: { postId_profileId: { postId, profileId: viewerProfileId } },
        select: { id: true },
      }),
    ]);

    return toSocialPost(row, this.config.fileBaseUrl, {
      likedByMe: Boolean(liked),
      savedByMe: Boolean(saved),
      sharedByMe: Boolean(shared),
    });
  }
}
