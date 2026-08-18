import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { QUEUE_NAMES } from '@talpio/types';

import { QueueService } from '@infra/queue/queue.service';
import { WorkerHeartbeatService } from '@infra/queue/worker-heartbeat.service';
import { PrismaService } from '@infra/prisma/prisma.service';

@Injectable()
export class QueueHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly queues: QueueService,
    private readonly heartbeat: WorkerHeartbeatService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      const [counts, workerAlive, staleMatches] = await Promise.all([
        this.queues.getJobCounts(),
        this.heartbeat.isAlive(),
        this.prisma.requestMatch.count({
          where: {
            notifiedAt: null,
            createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
          },
        }),
      ]);
      const waiting = counts[QUEUE_NAMES.NOTIFICATION]?.waiting ?? 0;
      const failed = counts[QUEUE_NAMES.NOTIFICATION]?.failed ?? 0;
      const dlq = counts[QUEUE_NAMES.DEAD_LETTER]?.waiting ?? 0;
      const down = !workerAlive && (waiting > 0 || staleMatches > 0);

      const details = {
        responseTimeMs: Date.now() - startedAt,
        workerAlive,
        waiting,
        failed,
        deadLetter: dlq,
        staleUnnotifiedMatches: staleMatches,
      };

      return down
        ? indicator.down({
            ...details,
            message: 'Worker kapalı; eşleşme bildirimleri kuyrukta bekliyor',
          })
        : indicator.up(details);
    } catch (error) {
      return indicator.down({
        message: error instanceof Error ? error.message : 'Kuyruk sağlığı okunamadı',
      });
    }
  }
}
