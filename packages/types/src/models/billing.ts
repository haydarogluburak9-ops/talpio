import type {
  AiCreditTxType,
  AiFeatureCode,
  SubscriptionPlanCode,
  SubscriptionProvider,
  SubscriptionStatus,
} from '../enums/billing';
import type { BaseEntity } from './common';

export interface SubscriptionPlan extends BaseEntity {
  code: SubscriptionPlanCode;
  name: string;
  monthlyCredits: number;
  sortOrder: number;
  isActive: boolean;
}

export interface Subscription extends BaseEntity {
  userId?: string | null;
  businessId?: string | null;
  planId: string;
  planCode?: SubscriptionPlanCode;
  status: SubscriptionStatus;
  provider: SubscriptionProvider;
  externalId?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface AiCreditWalletSummary {
  balanceCredits: number;
  periodStart: string;
  periodEnd: string;
  lifetimeGranted: number;
  lifetimeSpent: number;
  planCode: SubscriptionPlanCode;
  monthlyCredits: number;
}

export interface AiCreditTransaction {
  id: string;
  walletId: string;
  type: AiCreditTxType;
  /** Her zaman pozitif; yön `type` ile belirlenir. */
  amountCredits: number;
  balanceAfter: number;
  featureCode?: AiFeatureCode | string | null;
  idempotencyKey: string;
  usageRecordId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface AiFeature {
  id: string;
  code: AiFeatureCode;
  name: string;
  baseCostCredits: number;
  description?: string | null;
}

export interface AiUsageRecordView {
  id: string;
  userId?: string | null;
  businessId?: string | null;
  tenantId?: string | null;
  featureCode: AiFeatureCode | string;
  provider: string;
  model?: string | null;
  promptTokens: number;
  completionTokens: number;
  creditsCharged: number;
  durationMs: number;
  success: boolean;
  errorCode?: string | null;
  idempotencyKey?: string | null;
  requestId?: string | null;
  offerId?: string | null;
  workOrderId?: string | null;
  refundedAt?: string | null;
  createdAt: string;
}
