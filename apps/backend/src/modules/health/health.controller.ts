import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import { QUEUE_NAMES } from '@talpio/types';

import { RawResponse } from '@common/decorators/raw-response.decorator';
import { AppConfigService } from '@config/app-config.service';
import { MetricsService } from '@infra/metrics/metrics.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { QueueService } from '@infra/queue/queue.service';
import { WorkerHeartbeatService } from '@infra/queue/worker-heartbeat.service';
import { Public } from '@modules/auth/decorators/public.decorator';

import { AiHealthIndicator } from './indicators/ai.health';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { QueueHealthIndicator } from './indicators/queue.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly queuesIndicator: QueueHealthIndicator,
    private readonly ai: AiHealthIndicator,
    private readonly config: AppConfigService,
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
    private readonly heartbeat: WorkerHeartbeatService,
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
  @ApiOperation({ summary: 'Hazırlık kontrolü - API bağımlılıkları erişilebilir mi?' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('status')
  @RawResponse()
  @ApiOperation({ summary: 'Tüm kritik servislerin durumu (worker düşmesi HTTP 503 üretmez)' })
  async status(): Promise<{
    status: 'ok' | 'error';
    details: Record<string, { status: string; responseTimeMs?: number; message?: string }>;
  }> {
    const [database, redis, storage, queue, ai] = await Promise.all([
      this.prismaIndicator.isHealthy('database'),
      this.redis.isHealthy('redis'),
      this.storage.isHealthy('storage'),
      this.queuesIndicator.isHealthy('queue'),
      Promise.resolve(this.ai.isHealthy('ai')),
    ]);
    const details = { ...database, ...redis, ...storage, ...queue, ...ai };
    const coreDown = database.database?.status === 'down' || redis.redis?.status === 'down';
    return { status: coreDown ? 'error' : 'ok', details };
  }

  @Get('queues')
  @RawResponse()
  @ApiOperation({ summary: 'Kuyruk sayaçları, worker nabzı ve bekleyen eşleşme bildirimleri' })
  async queuesHealth(): Promise<{
    generatedAt: string;
    worker: { alive: boolean; heartbeat: Awaited<ReturnType<WorkerHeartbeatService['read']>> };
    queues: Awaited<ReturnType<QueueService['getJobCounts']>>;
    deadLetters: Awaited<ReturnType<QueueService['listDeadLetters']>>;
    staleUnnotifiedMatches: number;
    outboxPending: number;
    outboxFailed: number;
  }> {
    const [
      workerAlive,
      heartbeat,
      queues,
      deadLetters,
      staleUnnotifiedMatches,
      outboxPending,
      outboxFailed,
    ] = await Promise.all([
      this.heartbeat.isAlive(),
      this.heartbeat.read(),
      this.queues.getJobCounts(),
      this.queues.listDeadLetters(30),
      this.prisma.requestMatch.count({
        where: {
          notifiedAt: null,
          createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
        },
      }),
      this.prisma.outboxEvent.count({ where: { status: 'PENDING' } }),
      this.prisma.outboxEvent.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      worker: { alive: workerAlive, heartbeat },
      queues,
      deadLetters,
      staleUnnotifiedMatches,
      outboxPending,
      outboxFailed,
    };
  }

  @Get('metrics')
  @RawResponse()
  @ApiOperation({ summary: 'Süreç içi sayaçlar ve kuyruk/outbox özeti' })
  async metrics(): Promise<{
    generatedAt: string;
    counters: ReturnType<MetricsService['snapshot']>;
    outboxPending: number;
    queues: Awaited<ReturnType<QueueService['getJobCounts']>>;
    workerAlive: boolean;
    notificationWaiting: number;
  }> {
    const [outboxPending, queues, workerAlive] = await Promise.all([
      this.prisma.outboxEvent.count({ where: { status: 'PENDING' } }),
      this.queues.getJobCounts(),
      this.heartbeat.isAlive(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      counters: this.metricsService.snapshot(),
      outboxPending,
      queues,
      workerAlive,
      notificationWaiting: queues[QUEUE_NAMES.NOTIFICATION]?.waiting ?? 0,
    };
  }
}
