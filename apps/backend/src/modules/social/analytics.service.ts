import { Injectable } from '@nestjs/common';
import { PostType, type SocialAnalyticsSummary } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { ProfilesService } from './profiles.service';

const DEALISH = new Set<string>([
  PostType.DEAL,
  PostType.SPECIAL_PRICE,
  PostType.DISCOUNT,
  PostType.CAMPAIGN,
  PostType.BULK_PRICE,
  PostType.B2B_CAMPAIGN,
]);

export type { SocialAnalyticsSummary };

/** SC6 — işletme / kişisel profil sosyal özeti (ücretsiz). */
@Injectable()
export class SocialAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  async getMine(user: AuthenticatedUser): Promise<SocialAnalyticsSummary> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const aggregates = await this.prisma.post.aggregate({
      where: { authorProfileId: me.id, deletedAt: null },
      _sum: {
        likeCount: true,
        commentCount: true,
        saveCount: true,
        viewCount: true,
        shareCount: true,
        repostCount: true,
        uniqueViewCount: true,
        quoteRequestCount: true,
        messageStartCount: true,
        requestConversionCount: true,
        offerConversionCount: true,
      },
      _count: { _all: true },
    });

    const dealPostCount = await this.prisma.post.count({
      where: {
        authorProfileId: me.id,
        deletedAt: null,
        OR: [{ dealMetadata: { isNot: null } }, { type: { in: [...DEALISH] as never[] } }],
      },
    });

    return {
      profileId: me.id,
      followerCount: me.followerCount,
      followingCount: me.followingCount,
      postCount: aggregates._count._all,
      totalLikes: aggregates._sum.likeCount ?? 0,
      totalComments: aggregates._sum.commentCount ?? 0,
      totalSaves: aggregates._sum.saveCount ?? 0,
      totalViews: aggregates._sum.viewCount ?? 0,
      totalShares: aggregates._sum.shareCount ?? 0,
      totalReposts: aggregates._sum.repostCount ?? 0,
      uniqueViews: aggregates._sum.uniqueViewCount ?? 0,
      dealPostCount,
      quoteRequestCount: aggregates._sum.quoteRequestCount ?? 0,
      messageStartCount: aggregates._sum.messageStartCount ?? 0,
      requestConversionCount: aggregates._sum.requestConversionCount ?? 0,
      offerConversionCount: aggregates._sum.offerConversionCount ?? 0,
    };
  }

  async getForBusiness(user: AuthenticatedUser, businessId: string): Promise<SocialAnalyticsSummary> {
    const member = await this.prisma.businessMembership.findFirst({
      where: { businessId, userId: user.id },
      select: { id: true },
    });
    if (!member) {
      throw new AppException('FORBIDDEN', {
        message: 'Bu işletmenin analitiğine erişim yok.',
      });
    }
    const profile = await this.prisma.socialProfile.findFirst({
      where: { businessId, deletedAt: null },
    });
    if (!profile) {
      return {
        profileId: businessId,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        totalLikes: 0,
        totalComments: 0,
        totalSaves: 0,
        totalViews: 0,
        dealPostCount: 0,
      };
    }
    const aggregates = await this.prisma.post.aggregate({
      where: { authorProfileId: profile.id, deletedAt: null },
      _sum: {
        likeCount: true,
        commentCount: true,
        saveCount: true,
        viewCount: true,
        shareCount: true,
        repostCount: true,
        uniqueViewCount: true,
        quoteRequestCount: true,
        messageStartCount: true,
        requestConversionCount: true,
        offerConversionCount: true,
      },
      _count: { _all: true },
    });
    const dealPostCount = await this.prisma.post.count({
      where: {
        authorProfileId: profile.id,
        deletedAt: null,
        OR: [{ dealMetadata: { isNot: null } }, { type: { in: [...DEALISH] as never[] } }],
      },
    });
    return {
      profileId: profile.id,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
      postCount: aggregates._count._all,
      totalLikes: aggregates._sum.likeCount ?? 0,
      totalComments: aggregates._sum.commentCount ?? 0,
      totalSaves: aggregates._sum.saveCount ?? 0,
      totalViews: aggregates._sum.viewCount ?? 0,
      totalShares: aggregates._sum.shareCount ?? 0,
      totalReposts: aggregates._sum.repostCount ?? 0,
      uniqueViews: aggregates._sum.uniqueViewCount ?? 0,
      dealPostCount,
      quoteRequestCount: aggregates._sum.quoteRequestCount ?? 0,
      messageStartCount: aggregates._sum.messageStartCount ?? 0,
      requestConversionCount: aggregates._sum.requestConversionCount ?? 0,
      offerConversionCount: aggregates._sum.offerConversionCount ?? 0,
    };
  }
}
