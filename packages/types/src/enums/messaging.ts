export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  LOCATION: 'LOCATION',
  SYSTEM: 'SYSTEM',
  OFFER: 'OFFER',
  APPOINTMENT: 'APPOINTMENT',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export const ConversationStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  BLOCKED: 'BLOCKED',
} as const;

export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

/**
 * Bildirim türleri. Her tür için başlık ve gövde metni
 * `packages/localization` içindeki katalogdan çözülür; sunucu yalnızca
 * tür ve değişkenleri gönderir.
 */
export const NotificationType = {
  JOB_PUBLISHED: 'JOB_PUBLISHED',
  JOB_MATCHED: 'JOB_MATCHED',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  OFFER_REJECTED: 'OFFER_REJECTED',
  OFFER_EXPIRING: 'OFFER_EXPIRING',
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  APPOINTMENT_REMINDER: 'APPOINTMENT_REMINDER',
  PROVIDER_EN_ROUTE: 'PROVIDER_EN_ROUTE',
  JOB_STARTED: 'JOB_STARTED',
  JOB_COMPLETED: 'JOB_COMPLETED',
  REVIEW_REQUESTED: 'REVIEW_REQUESTED',
  REVIEW_RECEIVED: 'REVIEW_RECEIVED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYOUT_SENT: 'PAYOUT_SENT',
  DOCUMENT_APPROVED: 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',
  SUPPORT_REPLY: 'SUPPORT_REPLY',
  CAMPAIGN: 'CAMPAIGN',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationChannel = {
  IN_APP: 'IN_APP',
  PUSH: 'PUSH',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
} as const;

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const DevicePlatform = {
  IOS: 'IOS',
  ANDROID: 'ANDROID',
  WEB: 'WEB',
} as const;

export type DevicePlatform = (typeof DevicePlatform)[keyof typeof DevicePlatform];
