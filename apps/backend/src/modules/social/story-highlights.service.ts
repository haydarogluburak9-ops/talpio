import { Injectable, Logger } from '@nestjs/common';
import {
  PostVisibility,
  type SocialPost,
  type StoryHighlight,
  type StoryHighlightDetail,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type {
  AddStoryHighlightItemDto,
  CreateStoryHighlightDto,
  UpdateStoryHighlightDto,
} from './dto/social.dto';
import { ProfilesService } from './profiles.service';
import { postInclude, toSocialPost, toStoryHighlight } from './social.mapper';

const MAX_HIGHLIGHTS = 30;
const MAX_ITEMS_PER_HIGHLIGHT = 100;

@Injectable()
export class StoryHighlightsService {
  private readonly logger = new Logger(StoryHighlightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly profiles: ProfilesService,
  ) {}

  /** Profilin son 24 saatteki aktif hikâyeleri. */
  async listActiveStories(username: string): Promise<SocialPost[]> {
    const profile = await this.profiles.getByUsername(username);
    const since = new Date(Date.now() - this.config.storyTtlHours * 60 * 60 * 1000);

    const rows = await this.prisma.post.findMany({
      where: {
        authorProfileId: profile.id,
        deletedAt: null,
        createdAt: { gte: since },
        media: { some: {} },
        visibility: { in: [PostVisibility.PUBLIC, PostVisibility.FOLLOWERS] },
      },
      include: postInclude,
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return rows.map((row) => toSocialPost(row, this.config.fileBaseUrl));
  }

  /** Profildeki öne çıkan hikâye koleksiyonları. */
  async listByUsername(username: string): Promise<StoryHighlight[]> {
    const profile = await this.profiles.getByUsername(username);
    const rows = await this.prisma.storyHighlight.findMany({
      where: { profileId: profile.id },
      include: {
        cover: { select: { storageKey: true, isPublic: true } },
        _count: { select: { items: true } },
        items: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          include: {
            post: {
              include: {
                media: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                  include: { file: { select: { storageKey: true, isPublic: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return rows.map((row) => toStoryHighlight(row, this.config.fileBaseUrl));
  }

  /** Tek koleksiyon ve tüm hikâye gönderileri. */
  async getDetail(username: string, highlightId: string): Promise<StoryHighlightDetail> {
    const profile = await this.profiles.getByUsername(username);
    const row = await this.prisma.storyHighlight.findFirst({
      where: { id: highlightId, profileId: profile.id },
      include: {
        cover: { select: { storageKey: true, isPublic: true } },
        _count: { select: { items: true } },
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            post: {
              include: postInclude,
            },
          },
        },
      },
    });

    if (!row) throw AppException.notFound('Öne çıkan hikâye', highlightId);

    const base = toStoryHighlight(row, this.config.fileBaseUrl);
    const items = row.items
      .map((item) => item.post)
      .filter((post) => post.deletedAt == null && post.media.length > 0)
      .map((post) => toSocialPost(post, this.config.fileBaseUrl));

    return { ...base, items };
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateStoryHighlightDto,
  ): Promise<StoryHighlightDetail> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    const count = await this.prisma.storyHighlight.count({ where: { profileId: profile.id } });
    if (count >= MAX_HIGHLIGHTS) {
      throw new AppException('VALIDATION_ERROR', {
        message: `En fazla ${MAX_HIGHLIGHTS} öne çıkan oluşturabilirsiniz.`,
      });
    }

    const title = dto.title.trim();
    if (!title) {
      throw new AppException('VALIDATION_ERROR', { message: 'Başlık zorunludur.' });
    }

    if (dto.postId) await this.assertOwnMediaPost(profile.id, dto.postId);
    if (dto.coverFileId) await this.assertCoverFile(user.id, dto.coverFileId);

    const highlight = await this.prisma.storyHighlight.create({
      data: {
        profileId: profile.id,
        title,
        coverFileId: dto.coverFileId ?? null,
        sortOrder: count,
        ...(dto.postId
          ? {
              items: {
                create: { postId: dto.postId, sortOrder: 0 },
              },
            }
          : {}),
      },
    });

    this.logger.log(`Öne çıkan oluşturuldu: ${highlight.id} (${profile.username})`);
    return this.getDetail(profile.username, highlight.id);
  }

  async update(
    user: AuthenticatedUser,
    highlightId: string,
    dto: UpdateStoryHighlightDto,
  ): Promise<StoryHighlightDetail> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertOwnHighlight(profile.id, highlightId);

    if (dto.coverFileId) await this.assertCoverFile(user.id, dto.coverFileId);

    await this.prisma.storyHighlight.update({
      where: { id: highlightId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.coverFileId !== undefined ? { coverFileId: dto.coverFileId } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });

    return this.getDetail(profile.username, highlightId);
  }

  async delete(user: AuthenticatedUser, highlightId: string): Promise<void> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertOwnHighlight(profile.id, highlightId);
    await this.prisma.storyHighlight.delete({ where: { id: highlightId } });
  }

  async addItem(
    user: AuthenticatedUser,
    highlightId: string,
    dto: AddStoryHighlightItemDto,
  ): Promise<StoryHighlightDetail> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertOwnHighlight(profile.id, highlightId);
    await this.assertOwnMediaPost(profile.id, dto.postId);

    const itemCount = await this.prisma.storyHighlightItem.count({ where: { highlightId } });
    if (itemCount >= MAX_ITEMS_PER_HIGHLIGHT) {
      throw new AppException('VALIDATION_ERROR', {
        message: `Bir öne çıkanda en fazla ${MAX_ITEMS_PER_HIGHLIGHT} hikâye olabilir.`,
      });
    }

    const existing = await this.prisma.storyHighlightItem.findUnique({
      where: { highlightId_postId: { highlightId, postId: dto.postId } },
    });
    if (existing) {
      return this.getDetail(profile.username, highlightId);
    }

    await this.prisma.storyHighlightItem.create({
      data: { highlightId, postId: dto.postId, sortOrder: itemCount },
    });

    return this.getDetail(profile.username, highlightId);
  }

  async removeItem(
    user: AuthenticatedUser,
    highlightId: string,
    postId: string,
  ): Promise<StoryHighlightDetail> {
    const profile = await this.profiles.ensurePersonalProfile(user.id);
    await this.assertOwnHighlight(profile.id, highlightId);

    await this.prisma.storyHighlightItem.deleteMany({
      where: { highlightId, postId },
    });

    return this.getDetail(profile.username, highlightId);
  }

  private async assertOwnHighlight(profileId: string, highlightId: string): Promise<void> {
    const row = await this.prisma.storyHighlight.findFirst({
      where: { id: highlightId, profileId },
      select: { id: true },
    });
    if (!row) throw AppException.notFound('Öne çıkan hikâye', highlightId);
  }

  private async assertOwnMediaPost(profileId: string, postId: string): Promise<void> {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        authorProfileId: profileId,
        deletedAt: null,
        media: { some: {} },
      },
      select: { id: true },
    });
    if (!post) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Yalnızca kendi medyalı gönderilerinizi öne çıkarabilirsiniz.',
      });
    }
  }

  private async assertCoverFile(userId: string, fileId: string): Promise<void> {
    const file = await this.prisma.fileAsset.findFirst({
      where: { id: fileId, ownerUserId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!file) {
      throw new AppException('VALIDATION_ERROR', { message: 'Kapak görseli geçersiz.' });
    }
  }
}
