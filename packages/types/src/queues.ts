/**
 * BullMQ kuyruk adları ve iş yükü sözleşmeleri.
 *
 * API ve worker aynı tipleri kullanır; string sabitler dağılmaz.
 */

import type { NotificationParams } from './models/messaging';

export const QUEUE_NAMES = {
  AI_AGENT: 'ai-agent',
  DOCUMENT_GENERATION: 'document-generation',
  NOTIFICATION: 'notification',
  MEDIA_ANALYSIS: 'media-analysis',
  SOCIAL_MAINTENANCE: 'social-maintenance',
  DEAD_LETTER: 'dead-letter',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Tüm kuyruk işlerinde ortak zarf. */
export interface QueueJobEnvelope<TPayload> {
  /** Aynı anahtar ikinci kez kuyruğa alınmaz / tüketilmez. */
  idempotencyKey: string;
  /** İşletme sınırı; worker yeniden yetki kontrolü yapar. */
  tenantId: string;
  /** İstek izleme kimliği. */
  correlationId?: string;
  payload: TPayload;
  enqueuedAt: string;
}

export interface AiAgentJobPayload {
  threadId: string;
  messageId: string;
  userId: string;
}

export interface DocumentGenerationJobPayload {
  kind: 'quote_pdf' | 'invoice_pdf';
  entityId: string;
}

export interface NotificationDispatchJobPayload {
  /** Eski zarf: önceden yazılmış bildirim. */
  notificationId?: string;
  userId?: string;
  type?: string;
  params?: NotificationParams;
  deepLink?: string | null;
  dedupeKey?: string;
  requestId?: string;
  businessId?: string;
}

export interface MediaAnalysisJobPayload {
  fileId: string;
  purpose: 'job_photo' | 'document' | 'post_media';
}

export interface SocialMaintenanceJobPayload {
  task: 'story_cleanup' | 'orphan_files' | 'purge_deleted_posts';
}

/** Son denemesi tükenen iş; ayrı kuyrukta incelenir, otomatik yeniden işlenmez. */
export interface DeadLetterJobPayload {
  sourceQueue: Exclude<QueueName, 'dead-letter'>;
  originalJobId: string;
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
}

export type QueuePayloadByName = {
  [QUEUE_NAMES.AI_AGENT]: AiAgentJobPayload;
  [QUEUE_NAMES.DOCUMENT_GENERATION]: DocumentGenerationJobPayload;
  [QUEUE_NAMES.NOTIFICATION]: NotificationDispatchJobPayload;
  [QUEUE_NAMES.MEDIA_ANALYSIS]: MediaAnalysisJobPayload;
  [QUEUE_NAMES.SOCIAL_MAINTENANCE]: SocialMaintenanceJobPayload;
  [QUEUE_NAMES.DEAD_LETTER]: DeadLetterJobPayload;
};
