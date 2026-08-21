import 'module-alias/register';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type {
  QueueJobEnvelope,
  AiAgentJobPayload,
  MediaAnalysisJobPayload,
  NotificationDispatchJobPayload,
  SocialMaintenanceJobPayload,
} from '@talpio/types';
import { type NotificationType, QUEUE_NAMES } from '@talpio/types';
import type { Job } from 'bullmq';
import { Logger as PinoLogger } from 'nestjs-pino';

import { AppConfigService } from './config/app-config.service';
import { MediaProcessorService } from './infra/media/media-processor.service';
import { PrismaService } from './infra/prisma/prisma.service';
import { createQueueWorker } from './infra/queue/worker.factory';
import { QueueService } from './infra/queue/queue.service';
import { WorkerHeartbeatService } from './infra/queue/worker-heartbeat.service';
import { AgentService } from './modules/agent/agent.service';
import {
  type DispatchInput,
  NotificationsService,
} from './modules/notifications/notifications.service';
import { SocialMaintenanceService } from './modules/social/social-maintenance.service';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();

  const config = app.get(AppConfigService);
  const queues = app.get(QueueService);
  const agent = app.get(AgentService);
  const notifications = app.get(NotificationsService);
  const prisma = app.get(PrismaService);
  const mediaProcessor = app.get(MediaProcessorService);
  const socialMaintenance = app.get(SocialMaintenanceService);
  const heartbeat = app.get(WorkerHeartbeatService);
  const logger = new Logger('Worker');
  const stopHeartbeat = heartbeat.startInterval([
    QUEUE_NAMES.AI_AGENT,
    QUEUE_NAMES.NOTIFICATION,
    QUEUE_NAMES.MEDIA_ANALYSIS,
    QUEUE_NAMES.SOCIAL_MAINTENANCE,
  ]);

  const agentWorker = createQueueWorker(
    queues,
    config,
    QUEUE_NAMES.AI_AGENT,
    async (job: Job<QueueJobEnvelope<AiAgentJobPayload>>) => {
      const envelope = job.data;
      await agent.processQueuedMessage({
        threadId: envelope.payload.threadId,
        messageId: envelope.payload.messageId,
        userId: envelope.payload.userId,
        tenantId: envelope.tenantId,
      });
    },
  );

  const notificationWorker = createQueueWorker(
    queues,
    config,
    QUEUE_NAMES.NOTIFICATION,
    async (job: Job<QueueJobEnvelope<NotificationDispatchJobPayload>>) => {
      const payload = job.data.payload;
      if (!payload.userId || !payload.type) {
        throw new Error('Bildirim işi userId/type taşımıyor');
      }

      await notifications.dispatchStrict({
        userId: payload.userId,
        type: payload.type as NotificationType,
        params: (payload.params ?? {}) as never,
        deepLink: payload.deepLink,
        dedupeKey: payload.dedupeKey,
      } as DispatchInput);

      if (payload.requestId && payload.businessId) {
        await prisma.requestMatch.updateMany({
          where: {
            requestId: payload.requestId,
            businessId: payload.businessId,
            notifiedAt: null,
          },
          data: { notifiedAt: new Date() },
        });
      }
    },
  );

  const mediaWorker = createQueueWorker(
    queues,
    config,
    QUEUE_NAMES.MEDIA_ANALYSIS,
    async (job: Job<QueueJobEnvelope<MediaAnalysisJobPayload>>) => {
      const { fileId, purpose } = job.data.payload;
      if (purpose === 'post_media') {
        await mediaProcessor.processPostMedia(fileId);
      }
    },
  );

  const maintenanceWorker = createQueueWorker(
    queues,
    config,
    QUEUE_NAMES.SOCIAL_MAINTENANCE,
    async (job: Job<QueueJobEnvelope<SocialMaintenanceJobPayload>>) => {
      switch (job.data.payload.task) {
        case 'story_cleanup':
          await socialMaintenance.cleanupExpiredStoryMedia();
          break;
        case 'demo_story_refresh':
          await socialMaintenance.refreshDemoStoriesIfEnabled();
          break;
        case 'orphan_files':
          await socialMaintenance.purgeOrphanFiles();
          break;
        case 'purge_deleted_posts':
          await socialMaintenance.purgeSoftDeletedPosts();
          break;
        default:
          await socialMaintenance.runAll();
      }
    },
  );

  const scheduleMaintenance = () => {
    const intervalMs = config.get('SOCIAL_MAINTENANCE_INTERVAL_MS');
    const enqueueAll = () => {
      const at = new Date().toISOString();
      void queues.enqueue(QUEUE_NAMES.SOCIAL_MAINTENANCE, {
        idempotencyKey: `social-maintenance:all:${Math.floor(Date.now() / intervalMs)}`,
        tenantId: 'system',
        payload: { task: 'story_cleanup' },
        enqueuedAt: at,
      });
      void queues.enqueue(QUEUE_NAMES.SOCIAL_MAINTENANCE, {
        idempotencyKey: `social-maintenance:orphan:${Math.floor(Date.now() / intervalMs)}`,
        tenantId: 'system',
        payload: { task: 'orphan_files' },
        enqueuedAt: at,
      });
    };
    enqueueAll();
    setInterval(enqueueAll, intervalMs);
  };
  scheduleMaintenance();

  const scheduleDemoStoryRefresh = () => {
    if (!config.demoStoryRefreshEnabled) {
      logger.log('Demo hikâye otomatik yenileme kapalı (DEMO_STORY_REFRESH_ENABLED=false)');
      return;
    }
    const intervalMs = config.demoStoryRefreshIntervalMs;
    const enqueue = () => {
      void queues.enqueue(QUEUE_NAMES.SOCIAL_MAINTENANCE, {
        idempotencyKey: `demo-story-refresh:${Math.floor(Date.now() / intervalMs)}`,
        tenantId: 'system',
        payload: { task: 'demo_story_refresh' },
        enqueuedAt: new Date().toISOString(),
      });
    };
    enqueue();
    setInterval(enqueue, intervalMs);
    logger.log(`Demo hikâye yenileme zamanlayıcısı aktif (${Math.round(intervalMs / 3_600_000)} saat)`);
  };
  scheduleDemoStoryRefresh();

  const shutdown = async () => {
    logger.log('Worker kapanıyor…');
    stopHeartbeat();
    await agentWorker.close();
    await notificationWorker.close();
    await mediaWorker.close();
    await maintenanceWorker.close();
    await app.close();
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  logger.log(
    `Talpio worker ${config.nodeEnv} — kuyruklar=${QUEUE_NAMES.AI_AGENT},${QUEUE_NAMES.NOTIFICATION},${QUEUE_NAMES.MEDIA_ANALYSIS},${QUEUE_NAMES.SOCIAL_MAINTENANCE}`,
  );
}

void bootstrap();
