import { Injectable } from '@nestjs/common';
import type {
  RealtimeEvent,
  SocialPostCreatedPayload,
  SocialPostUpdatedPayload,
} from '@talpio/types';

import { FeedCacheService } from '@infra/cache/feed-cache.service';
import { RealtimeBusService } from '@infra/realtime/realtime-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';

@Injectable()
export class SocialRealtimeService {
  constructor(
    private readonly bus: RealtimeBusService,
    private readonly feedCache: FeedCacheService,
    private readonly prisma: PrismaService,
  ) {}

  private event(type: RealtimeEvent['type'], payload: Record<string, unknown>): RealtimeEvent {
    return { type, payload, at: new Date().toISOString() };
  }

  async invalidateFeedForUsers(userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map(async (userId) => {
        await this.feedCache.bumpUserVersion(userId);
        await this.bus.publishToUser(userId, this.event('social.feed.invalidate', {}));
      }),
    );
  }

  async invalidateStoriesForUsers(userIds: string[]): Promise<void> {
    await Promise.all(
      userIds.map((userId) =>
        this.bus.publishToUser(userId, this.event('social.stories.invalidate', {})),
      ),
    );
  }

  async invalidateProfile(username: string, userIds: string[]): Promise<void> {
    const payload: SocialPostCreatedPayload = {
      postId: '',
      authorProfileId: '',
      authorUsername: username,
    };
    await Promise.all(
      userIds.map((userId) =>
        this.bus.publishToUser(
          userId,
          this.event('social.profile.invalidate', payload as unknown as Record<string, unknown>),
        ),
      ),
    );
  }

  async postCreated(authorUserId: string, postId: string, authorProfileId: string): Promise<void> {
    await this.feedCache.bumpUserVersion(authorUserId);

    const followers = await this.prisma.follow.findMany({
      where: { followingProfileId: authorProfileId },
      select: { follower: { select: { userId: true } } },
      take: 2_000,
    });
    const followerUserIds = followers
      .map((row) => row.follower.userId)
      .filter((id): id is string => Boolean(id));

    const payload: SocialPostCreatedPayload = { postId, authorProfileId };
    const event = this.event('social.post.created', payload as unknown as Record<string, unknown>);

    await this.bus.publishToUser(authorUserId, event);
    await this.invalidateFeedForUsers(followerUserIds);
    await this.invalidateStoriesForUsers([authorUserId, ...followerUserIds]);
  }

  async postUpdated(
    postId: string,
    counts: SocialPostUpdatedPayload,
    actorUserId: string,
    authorUserId: string | null,
  ): Promise<void> {
    const payload: SocialPostUpdatedPayload = { ...counts, postId };
    const event = this.event('social.post.updated', payload as unknown as Record<string, unknown>);

    await this.bus.publishToPost(postId, event);
    await this.bus.publishToUser(actorUserId, event);
    if (authorUserId && authorUserId !== actorUserId) {
      await this.bus.publishToUser(authorUserId, event);
    }
  }

  async notification(userId: string, notificationId?: string, unreadCount?: number): Promise<void> {
    await this.bus.publishToUser(
      userId,
      this.event('notification.new', { notificationId, unreadCount }),
    );
  }
}
