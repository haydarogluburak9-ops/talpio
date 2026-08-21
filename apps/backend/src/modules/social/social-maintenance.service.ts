import { Injectable, Logger } from '@nestjs/common';
import { PostType } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { StorageService } from '@infra/storage/storage.service';

import { refreshDemoStories } from './demo-story-refresh';

@Injectable()
export class SocialMaintenanceService {
  private readonly logger = new Logger(SocialMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: AppConfigService,
  ) {}

  async runAll(): Promise<void> {
    await this.refreshDemoStoriesIfEnabled();
    await this.cleanupExpiredStoryMedia();
    await this.purgeOrphanFiles();
    await this.purgeSoftDeletedPosts();
  }

  /** Lansman öncesi: seed demo hikâyelerini periyodik yeniler. */
  async refreshDemoStoriesIfEnabled(): Promise<number> {
    if (!this.config.demoStoryRefreshEnabled) return 0;
    const created = await refreshDemoStories(this.prisma);
    if (created > 0) {
      this.logger.log(`Demo hikâyeler yenilendi: ${created} yeni`);
    }
    return created;
  }

  /** 24 saatten eski, etkileşimsiz hikâye medyasını depodan kaldırır (gönderi kalır). */
  async cleanupExpiredStoryMedia(): Promise<void> {
    const hours = this.config.storyTtlHours;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    const candidates = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        createdAt: { lt: cutoff },
        type: { in: [PostType.IMAGE, PostType.VIDEO] },
        likeCount: 0,
        commentCount: 0,
        saveCount: 0,
        shareCount: 0,
        media: { some: {} },
        highlightItems: { none: {} },
      },
      select: {
        id: true,
        media: {
          select: {
            file: { select: { id: true, storageKey: true, metadata: true } },
          },
        },
      },
      take: 200,
    });

    for (const post of candidates) {
      for (const media of post.media) {
        const file = media.file;
        const meta = file.metadata as { storyMediaPurged?: boolean; thumbStorageKey?: string } | null;
        if (meta?.storyMediaPurged) continue;

        await this.storage.remove(file.storageKey);
        if (meta?.thumbStorageKey) {
          await this.storage.remove(meta.thumbStorageKey);
        }

        await this.prisma.fileAsset.update({
          where: { id: file.id },
          data: {
            deletedAt: new Date(),
            metadata: { ...(meta ?? {}), storyMediaPurged: true },
          },
        });
      }
    }

    if (candidates.length > 0) {
      this.logger.log(`Süresi dolmuş hikâye medyası temizlendi: ${candidates.length} gönderi`);
    }
  }

  /** Hiçbir kayda bağlı olmayan 7 günden eski yüklemeleri siler. */
  async purgeOrphanFiles(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const orphans = await this.prisma.fileAsset.findMany({
      where: {
        deletedAt: null,
        createdAt: { lt: cutoff },
        postMedia: { none: {} },
        jobAttachments: { none: {} },
        messageAttachments: { none: {} },
        providerDocuments: { none: {} },
        requestAttachments: { none: {} },
        userAvatars: { none: {} },
        socialAvatars: { none: {} },
        socialCovers: { none: {} },
        crmNotes: { none: {} },
      },
      take: 100,
      select: { id: true, storageKey: true, metadata: true },
    });

    for (const file of orphans) {
      const meta = file.metadata as { thumbStorageKey?: string } | null;
      await this.storage.remove(file.storageKey);
      if (meta?.thumbStorageKey) await this.storage.remove(meta.thumbStorageKey);
      await this.prisma.fileAsset.update({
        where: { id: file.id },
        data: { deletedAt: new Date() },
      });
    }

    if (orphans.length > 0) {
      this.logger.log(`Yetim dosya temizlendi: ${orphans.length}`);
    }
  }

  /** 30 günden eski soft-delete gönderileri ve medyalarını kalıcı siler. */
  async purgeSoftDeletedPosts(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const posts = await this.prisma.post.findMany({
      where: { deletedAt: { not: null, lt: cutoff } },
      select: {
        id: true,
        media: { select: { file: { select: { storageKey: true, metadata: true } } } },
      },
      take: 100,
    });

    for (const post of posts) {
      for (const media of post.media) {
        const meta = media.file.metadata as { thumbStorageKey?: string } | null;
        await this.storage.remove(media.file.storageKey);
        if (meta?.thumbStorageKey) await this.storage.remove(meta.thumbStorageKey);
      }
      await this.prisma.post.delete({ where: { id: post.id } });
    }

    if (posts.length > 0) {
      this.logger.log(`Eski silinmiş gönderi kalıcı temizlendi: ${posts.length}`);
    }
  }
}
