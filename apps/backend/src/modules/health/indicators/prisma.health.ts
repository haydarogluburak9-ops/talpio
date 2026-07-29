import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { PrismaService } from '@infra/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      await this.prisma.ping();
      return indicator.up({ responseTimeMs: Date.now() - startedAt });
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'PostgreSQL erişilemiyor',
      });
    }
  }
}
