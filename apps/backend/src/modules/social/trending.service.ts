import { Injectable } from '@nestjs/common';
import type { TrendingTopic } from '@talpio/types';

import { PrismaService } from '@infra/prisma/prisma.service';

import { SocialGraphService } from './graph.service';
import { TRENDING_WINDOW_HOURS, computeTrendingScore } from './trending';

@Injectable()
export class TrendingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly graph: SocialGraphService,
  ) {}

  async list(
    limit = 10,
    opts: { cityId?: string; categoryId?: string } = {},
  ): Promise<TrendingTopic[]> {
    const since = new Date(Date.now() - TRENDING_WINDOW_HOURS * 60 * 60 * 1000);
    const windowStart = new Date(since);
    windowStart.setMinutes(0, 0, 0);

    const rows = await this.prisma.postHashtag.findMany({
      where: { createdAt: { gte: since } },
      include: {
        hashtag: { select: { id: true, slug: true, display: true, postCount: true } },
        post: {
          select: {
            id: true,
            authorProfileId: true,
            likeCount: true,
            commentCount: true,
            saveCount: true,
            shareCount: true,
            repostCount: true,
            commerceRequestId: true,
            createdAt: true,
            dealMetadata: { select: { categoryId: true } },
            author: { select: { locationCityId: true } },
            likes: { select: { profileId: true } },
            comments: { where: { deletedAt: null }, select: { authorProfileId: true } },
            saves: { select: { profileId: true } },
            shares: { select: { profileId: true } },
          },
        },
      },
    });

    const byHashtag = new Map<
      string,
      {
        hashtagId: string;
        slug: string;
        display: string;
        postCount: number;
        unique: Set<string>;
        likeCount: number;
        commentCount: number;
        saveCount: number;
        shareCount: number;
        repostCount: number;
        requestConversions: number;
        newest: Date;
        authors: Set<string>;
      }
    >();

    for (const row of rows) {
      const post = row.post;
      if (!post) continue;
      const bucket = byHashtag.get(row.hashtag.slug) ?? {
        hashtagId: row.hashtag.id,
        slug: row.hashtag.slug,
        display: row.hashtag.display,
        postCount: row.hashtag.postCount,
        unique: new Set<string>(),
        likeCount: 0,
        commentCount: 0,
        saveCount: 0,
        shareCount: 0,
        repostCount: 0,
        requestConversions: 0,
        newest: post.createdAt,
        authors: new Set<string>(),
      };

      bucket.authors.add(post.authorProfileId);
      bucket.likeCount += post.likeCount;
      bucket.commentCount += post.commentCount;
      bucket.saveCount += post.saveCount;
      bucket.shareCount += post.shareCount;
      bucket.repostCount += post.repostCount;
      if (post.commerceRequestId) bucket.requestConversions += 1;
      if (post.createdAt > bucket.newest) bucket.newest = post.createdAt;

      bucket.unique.add(post.authorProfileId);
      for (const like of post.likes) bucket.unique.add(like.profileId);
      for (const comment of post.comments) bucket.unique.add(comment.authorProfileId);
      for (const save of post.saves) bucket.unique.add(save.profileId);
      for (const share of post.shares) bucket.unique.add(share.profileId);

      byHashtag.set(row.hashtag.slug, bucket);
    }

    const scored: TrendingTopic[] = [];
    for (const bucket of byHashtag.values()) {
      const authorSpam =
        bucket.authors.size === 1
          ? await this.graph.isHashtagSpam([...bucket.authors][0]!, bucket.slug)
          : false;
      const freshnessHours = Math.max(1, (Date.now() - bucket.newest.getTime()) / (60 * 60 * 1000));
      const score = computeTrendingScore({
        uniqueInteractions: bucket.unique.size,
        likeCount: bucket.likeCount,
        commentCount: bucket.commentCount,
        saveCount: bucket.saveCount,
        shareCount: bucket.shareCount,
        repostCount: bucket.repostCount,
        requestConversions: bucket.requestConversions,
        freshnessHours,
        regionalMatch: Boolean(opts.cityId),
        categoryMatch: Boolean(opts.categoryId),
        authorSpam,
      });
      if (score <= 0) continue;
      scored.push({
        slug: bucket.slug,
        display: bucket.display,
        score,
        uniqueInteractions: bucket.unique.size,
        postCount: bucket.postCount,
      });

      await this.prisma.trendingTopic.upsert({
        where: {
          hashtagId_windowStart: { hashtagId: bucket.hashtagId, windowStart },
        },
        create: {
          hashtagId: bucket.hashtagId,
          windowStart,
          score: Math.round(score),
          uniqueInteractions: bucket.unique.size,
          engagementVelocity: score,
          saveCount: bucket.saveCount,
          requestConversions: bucket.requestConversions,
          regionCityId: opts.cityId ?? null,
          categoryId: opts.categoryId ?? null,
        },
        update: {
          score: Math.round(score),
          uniqueInteractions: bucket.unique.size,
          engagementVelocity: score,
          saveCount: bucket.saveCount,
          requestConversions: bucket.requestConversions,
          computedAt: new Date(),
        },
      });
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
