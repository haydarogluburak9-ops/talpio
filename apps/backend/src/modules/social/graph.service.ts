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

    for (const tag of tags) {
      const hashtag = await tx.hashtag.upsert({
        where: { slug: tag.slug },
        create: { slug: tag.slug, display: tag.display, postCount: 1 },
        update: { postCount: { increment: 1 }, display: tag.display },
      });
      await tx.postHashtag.create({
        data: { postId, hashtagId: hashtag.id },
      });
    }

    if (usernames.length > 0) {
      const profiles = await tx.socialProfile.findMany({
        where: { username: { in: usernames }, deletedAt: null },
        select: { id: true, userId: true, username: true, displayName: true },
      });
      for (const profile of profiles) {
        if (profile.id === authorProfileId) continue;
        await tx.postMention.create({
          data: { postId, profileId: profile.id },
        });
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
