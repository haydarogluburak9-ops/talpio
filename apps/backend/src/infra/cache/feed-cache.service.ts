import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';
import { RedisService } from '@infra/redis/redis.service';

const PREFIX = 'talpio:feed';

@Injectable()
export class FeedCacheService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {}

  private ttl(): number {
    return this.config.feedCacheTtlSeconds;
  }

  /** Anahtar kullanıcı sürümünü taşır; `bumpUserVersion` eski girdileri erişilemez kılar. */
  private async key(
    scope: string,
    userId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<string> {
    const cursorPart = cursor ?? 'start';
    const version = await this.getUserVersion(userId);
    const hash = createHash('sha1')
      .update(`${scope}:${userId}:${cursorPart}:${limit}:v${version}`)
      .digest('hex');
    return `${PREFIX}:${scope}:${hash}`;
  }

  async get<T>(scope: string, userId: string, cursor: string | undefined, limit: number): Promise<T | null> {
    if (this.ttl() <= 0) return null;
    return this.redis.get<T>(await this.key(scope, userId, cursor, limit));
  }

  async set<T>(
    scope: string,
    userId: string,
    cursor: string | undefined,
    limit: number,
    value: T,
  ): Promise<void> {
    if (this.ttl() <= 0) return;
    await this.redis.set(await this.key(scope, userId, cursor, limit), value, this.ttl());
  }

  /** Kullanıcının feed önbelleğini temizler (pattern yerine versiyon artırımı). */
  async bumpUserVersion(userId: string): Promise<void> {
    await this.redis.increment(`${PREFIX}:ver:${userId}`, 86_400);
  }

  async getUserVersion(userId: string): Promise<number> {
    const raw = await this.redis.raw.get(`${PREFIX}:ver:${userId}`);
    return raw ? Number.parseInt(raw, 10) : 0;
  }
}
