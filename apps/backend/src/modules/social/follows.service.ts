import { Injectable } from '@nestjs/common';
import { deepLinks } from '@talpio/config';
import { NotificationType, type SocialProfile } from '@talpio/types';

import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type { ListSocialQueryDto } from './dto/social.dto';
import { ProfilesService } from './profiles.service';
import { socialProfileSelect, toSocialProfile } from './social.mapper';

@Injectable()
export class FollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly profiles: ProfilesService,
    private readonly notifications: NotificationsService,
  ) {}

  async follow(user: AuthenticatedUser, username: string): Promise<SocialProfile> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const target = await this.requireProfileByUsername(username);

    if (me.id === target.id) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Kendinizi takip edemezsiniz.',
      });
    }

    await this.assertNotBlocked(user.id, target.userId);

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerProfileId_followingProfileId: {
          followerProfileId: me.id,
          followingProfileId: target.id,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: { followerProfileId: me.id, followingProfileId: target.id },
        });
        await tx.socialProfile.update({
          where: { id: me.id },
          data: { followingCount: { increment: 1 } },
        });
        await tx.socialProfile.update({
          where: { id: target.id },
          data: { followerCount: { increment: 1 } },
        });
      });

      if (target.userId && target.userId !== user.id) {
        await this.notifications.dispatch({
          userId: target.userId,
          type: NotificationType.SOCIAL_FOLLOW,
          params: { actorName: me.displayName, actorUsername: me.username },
          deepLink: deepLinks.socialProfile(me.username),
        });
      }
    }

    return this.profiles.getByUsername(username, user.id);
  }

  async unfollow(user: AuthenticatedUser, username: string): Promise<SocialProfile> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const target = await this.requireProfileByUsername(username);

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerProfileId_followingProfileId: {
          followerProfileId: me.id,
          followingProfileId: target.id,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.$transaction(async (tx) => {
        await tx.follow.delete({ where: { id: existing.id } });
        await tx.socialProfile.update({
          where: { id: me.id },
          data: { followingCount: { decrement: 1 } },
        });
        await tx.socialProfile.update({
          where: { id: target.id },
          data: { followerCount: { decrement: 1 } },
        });
      });
    }

    return this.profiles.getByUsername(username, user.id);
  }

  async listFollowers(
    username: string,
    query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialProfile>> {
    const target = await this.requireProfileByUsername(username);
    const where = { followingProfileId: target.id };

    const [rows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { follower: { select: socialProfileSelect } },
      }),
      this.prisma.follow.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => toSocialProfile(row.follower, this.config.fileBaseUrl)),
      total,
      query.page,
      query.limit,
    );
  }

  async listFollowing(
    username: string,
    query: ListSocialQueryDto,
  ): Promise<PaginatedResult<SocialProfile>> {
    const target = await this.requireProfileByUsername(username);
    const where = { followerProfileId: target.id };

    const [rows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
        include: { following: { select: socialProfileSelect } },
      }),
      this.prisma.follow.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => toSocialProfile(row.following, this.config.fileBaseUrl)),
      total,
      query.page,
      query.limit,
    );
  }

  private async requireProfileByUsername(username: string) {
    const row = await this.prisma.socialProfile.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: { id: true, userId: true, username: true },
    });
    if (!row) throw AppException.notFound('Profil', username);
    return row;
  }

  /** İki yönlü engel varsa etkileşimi keser. */
  private async assertNotBlocked(actorUserId: string, targetUserId: string | null): Promise<void> {
    if (!targetUserId) return;

    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerUserId: actorUserId, blockedUserId: targetUserId },
          { blockerUserId: targetUserId, blockedUserId: actorUserId },
        ],
      },
      select: { id: true },
    });

    if (block) {
      throw new AppException('FORBIDDEN', {
        message: 'Bu kullanıcıyla etkileşim kuramazsınız.',
      });
    }
  }
}
