import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import type { RealtimeEvent } from '@talpio/types';
import Redis from 'ioredis';

import { AppConfigService } from '@config/app-config.service';
import { RedisService } from '@infra/redis/redis.service';

export type RealtimeListener = (event: RealtimeEvent) => void;

const userChannel = (userId: string) => `talpio:rt:user:${userId}`;
const postChannel = (postId: string) => `talpio:rt:post:${postId}`;

/**
 * Redis pub/sub ile çok örnekli SSE dağıtımı.
 */
@Injectable()
export class RealtimeBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RealtimeBusService.name);
  private subscriber: Redis | null = null;
  private readonly localListeners = new Map<string, Set<RealtimeListener>>();

  constructor(
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.realtimeEnabled) return;

    const { host, port, password, db } = this.config.redis;
    this.subscriber = new Redis({
      host,
      port,
      db,
      ...(password ? { password } : {}),
      lazyConnect: true,
    });
    await this.subscriber.connect();

    this.subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message) as RealtimeEvent;
        const listeners = this.localListeners.get(channel);
        if (!listeners) return;
        for (const listener of listeners) listener(event);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Realtime mesajı çözülemedi (${channel}): ${msg}`);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber?.quit();
  }

  async publishToUser(userId: string, event: RealtimeEvent): Promise<void> {
    if (!this.config.realtimeEnabled) return;
    await this.redis.raw.publish(userChannel(userId), JSON.stringify(event));
  }

  async publishToPost(postId: string, event: RealtimeEvent): Promise<void> {
    if (!this.config.realtimeEnabled) return;
    await this.redis.raw.publish(postChannel(postId), JSON.stringify(event));
  }

  async publishToUsers(userIds: string[], event: RealtimeEvent): Promise<void> {
    const unique = [...new Set(userIds.filter(Boolean))];
    await Promise.all(unique.map((userId) => this.publishToUser(userId, event)));
  }

  async subscribeUser(userId: string, listener: RealtimeListener): Promise<() => void> {
    const channel = userChannel(userId);
    return this.attach(channel, listener);
  }

  async subscribePosts(postIds: string[], listener: RealtimeListener): Promise<() => void> {
    const channels = [...new Set(postIds.filter(Boolean))].map(postChannel);
    const detachFns = await Promise.all(channels.map((channel) => this.attach(channel, listener)));
    return () => {
      for (const detach of detachFns) detach();
    };
  }

  private async attach(channel: string, listener: RealtimeListener): Promise<() => void> {
    if (!this.subscriber) {
      return () => undefined;
    }

    let set = this.localListeners.get(channel);
    if (!set) {
      set = new Set();
      this.localListeners.set(channel, set);
      await this.subscriber.subscribe(channel);
    }
    set.add(listener);

    return () => {
      const listeners = this.localListeners.get(channel);
      if (!listeners) return;
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.localListeners.delete(channel);
        void this.subscriber?.unsubscribe(channel);
      }
    };
  }
}
