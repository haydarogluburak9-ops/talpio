/** Abonelik plan kodları. Birincil gelir: premium AI kredileri. */
export const SubscriptionPlanCode = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  PREMIUM_PLUS: 'PREMIUM_PLUS',
  BUSINESS: 'BUSINESS',
} as const;

export type SubscriptionPlanCode =
  (typeof SubscriptionPlanCode)[keyof typeof SubscriptionPlanCode];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  CANCELED: 'CANCELED',
  PAST_DUE: 'PAST_DUE',
  TRIALING: 'TRIALING',
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const SubscriptionProvider = {
  INTERNAL: 'INTERNAL',
  STRIPE: 'STRIPE',
  APP_STORE: 'APP_STORE',
  PLAY: 'PLAY',
} as const;

export type SubscriptionProvider =
  (typeof SubscriptionProvider)[keyof typeof SubscriptionProvider];

/** AI kredi cüzdanı hareket türleri. */
export const AiCreditTxType = {
  GRANT: 'GRANT',
  DEBIT: 'DEBIT',
  REFUND: 'REFUND',
  ADJUST: 'ADJUST',
} as const;

export type AiCreditTxType = (typeof AiCreditTxType)[keyof typeof AiCreditTxType];

/** Faturalandırılabilir AI özellik kodları. */
export const AiFeatureCode = {
  AGENT_CHAT: 'AGENT_CHAT',
  REQUEST_DRAFT: 'REQUEST_DRAFT',
  OFFER_DRAFT: 'OFFER_DRAFT',
  IMAGE_ANALYSIS: 'IMAGE_ANALYSIS',
  AUDIO_TRANSCRIBE: 'AUDIO_TRANSCRIBE',
  DOC_ANALYSIS: 'DOC_ANALYSIS',
  GENERIC_COMPLETE: 'GENERIC_COMPLETE',
  SOCIAL_DRAFT: 'SOCIAL_DRAFT',
  SALES_COACH: 'SALES_COACH',
} as const;

export type AiFeatureCode = (typeof AiFeatureCode)[keyof typeof AiFeatureCode];
