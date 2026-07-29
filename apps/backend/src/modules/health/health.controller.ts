import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

import { RawResponse } from '@common/decorators/raw-response.decorator';
import { AppConfigService } from '@config/app-config.service';

import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly config: AppConfigService,
  ) {}

  @Get()
  @RawResponse()
  @ApiOperation({ summary: 'Canlılık kontrolü - süreç ayakta mı?' })
  live(): { status: string; environment: string; timestamp: string } {
    return {
      status: 'ok',
      environment: this.config.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @RawResponse()
  @HealthCheck()
  @ApiOperation({ summary: 'Hazırlık kontrolü - bağımlılıklar erişilebilir mi?' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }
}
