import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import { QUEUE_NAMES, type QueueJobEnvelope, type QueueName, type QueuePayloadByName } from '@talpio/types';
import { Queue, type ConnectionOptions, type JobsOptions } from 'bullmq';

import { AppConfigService } from '@config/app-config.service';

import { ALL_QUEUE_NAMES, DEFAULT_JOB_OPTIONS } from './queue.constants';

export type QueueCounts = Record<
  string,
  { waiting: number; active: number; completed: number; failed: number; delayed: number }
>;

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<QueueName, Queue>();
  private readonly connection: ConnectionOptions;

  constructor(config: AppConfigService) {
    const redis = config.redis;
    this.connection = {
      host: redis.host,
      port: redis.port,
      db: redis.db,
      ...(redis.password ? { password: redis.password } : {}),
      maxRetriesPerRequest: null,
    };

    for (const name of ALL_QUEUE_NAMES) {
      this.queues.set(
        name,
        new Queue(name, {
          connection: this.connection,
          defaultJobOptions: { ...DEFAULT_JOB_OPTIONS },
        }),
      );
    }
  }

  getConnection(): ConnectionOptions {
    return this.connection;
  }

  getQueue(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(`Kuyruk tanımlı değil: ${name}`);
    }
    return queue;
  }

  /**
   * Idempotent kuyruğa alma: `jobId = idempotencyKey`.
   * Aynı anahtar ikinci kez eklenmez (BullMQ duplicate jobId).
   */
  async enqueue<N extends QueueName>(
    queueName: N,
    envelope: QueueJobEnvelope<QueuePayloadByName[N]>,
    options?: JobsOptions,
  ): Promise<string> {
    const queue = this.getQueue(queueName);
    const jobId = envelope.idempotencyKey.replace(/:/g, '-');
    const job = await queue.add(queueName, envelope, {
      jobId,
      ...options,
    });
    this.logger.debug(
      { queueName, jobId: job.id, tenantId: envelope.tenantId },
      'İş kuyruğa alındı',
    );
    return job.id ?? jobId;
  }

  async getJobCounts(): Promise<QueueCounts> {
    const result: QueueCounts = {};
    for (const name of ALL_QUEUE_NAMES) {
      const counts = await this.getQueue(name).getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      );
      result[name] = {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        completed: counts.completed ?? 0,
        failed: counts.failed ?? 0,
        delayed: counts.delayed ?? 0,
      };
    }
    return result;
  }

  async enqueueDeadLetter(input: {
    sourceQueue: Exclude<QueueName, 'dead-letter'>;
    originalJobId: string;
    failedReason: string;
    attemptsMade: number;
    tenantId?: string;
    correlationId?: string;
  }): Promise<string> {
    return this.enqueue(QUEUE_NAMES.DEAD_LETTER, {
      idempotencyKey: `dlq:${input.sourceQueue}:${input.originalJobId}`,
      tenantId: input.tenantId ?? 'platform',
      ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      enqueuedAt: new Date().toISOString(),
      payload: {
        sourceQueue: input.sourceQueue,
        originalJobId: input.originalJobId,
        failedReason: input.failedReason.slice(0, 500),
        attemptsMade: input.attemptsMade,
        failedAt: new Date().toISOString(),
      },
    });
  }

  async listDeadLetters(limit = 50): Promise<
    Array<{
      id: string;
      sourceQueue: string;
      originalJobId: string;
      failedReason: string;
      attemptsMade: number;
      failedAt: string;
    }>
  > {
    const jobs = await this.getQueue(QUEUE_NAMES.DEAD_LETTER).getJobs(['waiting', 'completed'], 0, limit - 1);
    return jobs.map((job) => {
      const payload = job.data.payload;
      return {
        id: String(job.id ?? ''),
        sourceQueue: payload.sourceQueue,
        originalJobId: payload.originalJobId,
        failedReason: payload.failedReason,
        attemptsMade: payload.attemptsMade,
        failedAt: payload.failedAt,
      };
    });
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
  }
}
