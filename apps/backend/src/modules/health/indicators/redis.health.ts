import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { RedisService } from '@infra/redis/redis.service';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly redis: RedisService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      const alive = await this.redis.ping();
      return alive
        ? indicator.up({ responseTimeMs: Date.now() - startedAt })
        : indicator.down({ message: 'Redis PONG cevabı alınamadı' });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Redis erişilemiyor',
      });
    }
  }
}
