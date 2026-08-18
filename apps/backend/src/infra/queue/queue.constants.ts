import { QUEUE_NAMES, type QueueName } from '@talpio/types';

export const QUEUE_SERVICE = Symbol('QUEUE_SERVICE');

export const ALL_QUEUE_NAMES: QueueName[] = [
  QUEUE_NAMES.AI_AGENT,
  QUEUE_NAMES.DOCUMENT_GENERATION,
  QUEUE_NAMES.NOTIFICATION,
  QUEUE_NAMES.MEDIA_ANALYSIS,
  QUEUE_NAMES.SOCIAL_MAINTENANCE,
  QUEUE_NAMES.DEAD_LETTER,
];

export const WORKER_HEARTBEAT_KEY = 'talpio:worker:heartbeat';
export const WORKER_HEARTBEAT_TTL_SECONDS = 45;

/** Varsayılan iş seçenekleri: yeniden deneme, backoff, tamamlananları temizle. */
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1_000 },
  removeOnComplete: { count: 200 },
  /** Başarısız işler dead-letter incelemesi için tutulur. */
  removeOnFail: { count: 1_000 },
};
