import { Injectable } from '@nestjs/common';

import type { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@infra/prisma/prisma.service';

import { extractHashtags, extractMentions } from './hashtag.util';

const SPAM_WINDOW_MS = 6 * 60 * 60 * 1000;
const SPAM_HASHTAG_REPEAT = 5;

@Injectable()
export class SocialGraphService {
  constructor(private readonly prisma: PrismaService) {}

  async attachBodyEntities(
    tx: Prisma.TransactionClient,
    postId: string,
    body: string | null,
    authorProfileId: string,
  ): Promise<{ mentionedUserIds: string[]; mentionedNames: Map<string, string> }> {
    const tags = extractHashtags(body);
    const usernames = extractMentions(body);
    const mentionedUserIds: string[] = [];
    const mentionedNames = new Map<string, string>();

    // Etiket sayısından bağımsız sabit sayıda sorgu. Etiket başına upsert +
    // create yapıldığında 10 etiketli bir gönderi 20 gidiş-dönüş demekti ve
    // paylaşım tuşu saniyelerce basılı kalıyordu.
    if (tags.length > 0) {
      await tx.hashtag.createMany({
        data: tags.map((tag) => ({ slug: tag.slug, display: tag.display, postCount: 0 })),
        skipDuplicates: true,
      });

      const slugs = tags.map((tag) => tag.slug);
      const rows = await tx.hashtag.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, slug: true },
      });

      await tx.hashtag.updateMany({
        where: { slug: { in: slugs } },
        data: { postCount: { increment: 1 } },
      });

      await tx.postHashtag.createMany({
        data: rows.map((row) => ({ postId, hashtagId: row.id })),
        skipDuplicates: true,
      });
    }

    if (usernames.length > 0) {
      const profiles = await tx.socialProfile.findMany({
        where: { username: { in: usernames }, deletedAt: null },
        select: { id: true, userId: true, username: true, displayName: true },
      });
      const mentioned = profiles.filter((profile) => profile.id !== authorProfileId);

      if (mentioned.length > 0) {
        await tx.postMention.createMany({
          data: mentioned.map((profile) => ({ postId, profileId: profile.id })),
          skipDuplicates: true,
        });
      }

      for (const profile of mentioned) {
        if (profile.userId) {
          mentionedUserIds.push(profile.userId);
          mentionedNames.set(profile.userId, profile.displayName);
        }
      }
    }

    return { mentionedUserIds, mentionedNames };
  }

  async isHashtagSpam(authorProfileId: string, slug: string, now = new Date()): Promise<boolean> {
    const since = new Date(now.getTime() - SPAM_WINDOW_MS);
    const count = await this.prisma.postHashtag.count({
      where: {
        hashtag: { slug },
        createdAt: { gte: since },
        post: { authorProfileId, deletedAt: null },
      },
    });
    return count >= SPAM_HASHTAG_REPEAT;
  }
}
