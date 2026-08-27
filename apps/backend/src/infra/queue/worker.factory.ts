import { Logger } from '@nestjs/common';
import {
  QUEUE_NAMES,
  type QueueName,
  type QueueJobEnvelope,
  type QueuePayloadByName,
} from '@talpio/types';
import { Worker, type Processor, type WorkerOptions } from 'bullmq';

import { type AppConfigService } from '@config/app-config.service';

import { type QueueService } from './queue.service';

const logger = new Logger('WorkerFactory');

/**
 * BullMQ Worker fabrikası. Worker süreci ve (isteğe bağlı) API içi dinleyiciler
 * aynı bağlantı / concurrency ayarlarını kullanır.
 */
export function createQueueWorker<N extends QueueName>(
  queueService: QueueService,
  config: AppConfigService,
  queueName: N,
  processor: Processor<QueueJobEnvelope<QueuePayloadByName[N]>>,
  options?: Partial<WorkerOptions>,
): Worker<QueueJobEnvelope<QueuePayloadByName[N]>> {
  const worker = new Worker<QueueJobEnvelope<QueuePayloadByName[N]>>(queueName, processor, {
    connection: queueService.getConnection(),
    concurrency: config.workerConcurrency,
    ...options,
  });

  worker.on('failed', (job, error) => {
    const attempts = job?.opts.attempts ?? 3;
    const made = job?.attemptsMade ?? 0;
    logger.error(
      { queueName, jobId: job?.id, attemptsMade: made, err: error.message },
      'Kuyruk işi başarısız',
    );
    if (queueName !== QUEUE_NAMES.DEAD_LETTER && job?.id && made >= attempts) {
      void queueService
        .enqueueDeadLetter({
          sourceQueue: queueName,
          originalJobId: String(job.id),
          failedReason: error.message,
          attemptsMade: made,
          tenantId: job.data?.tenantId,
          correlationId: job.data?.correlationId,
        })
        .catch((dlqError: unknown) => {
          logger.error({ queueName, jobId: job.id, dlqError }, 'Dead-letter kuyruğuna yazılamadı');
        });
    }
  });

  worker.on('completed', (job) => {
    logger.debug({ queueName, jobId: job.id }, 'Kuyruk işi tamamlandı');
  });

  worker.on('error', (error) => {
    logger.error({ queueName, err: error.message }, 'Worker bağlantı/işleme hatası');
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ queueName, jobId }, 'Kuyruk işi takıldı (stalled)');
  });

  worker.on('closed', () => {
    logger.warn({ queueName }, 'Worker kuyruk bağlantısını kapattı');
  });

  return worker;
}
