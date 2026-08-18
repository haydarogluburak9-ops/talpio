import { API_ROUTES } from '@talpio/config';
import type {
  AiCreditTransaction,
  AiCreditWalletSummary,
  AiUsageRecordView,
  SubscriptionPlan,
} from '@talpio/types';

import type { HttpClient } from '../http-client';

export function createBillingResource(http: HttpClient) {
  return {
    credits(signal?: AbortSignal): Promise<AiCreditWalletSummary> {
      return http.get<AiCreditWalletSummary>(API_ROUTES.billing.credits, {
        ...(signal ? { signal } : {}),
      });
    },

    transactions(limit?: number, signal?: AbortSignal): Promise<AiCreditTransaction[]> {
      return http.get<AiCreditTransaction[]>(API_ROUTES.billing.transactions, {
        query: limit != null ? { limit } : undefined,
        ...(signal ? { signal } : {}),
      });
    },

    usage(limit?: number, signal?: AbortSignal): Promise<AiUsageRecordView[]> {
      return http.get<AiUsageRecordView[]>(API_ROUTES.billing.usage, {
        query: limit != null ? { limit } : undefined,
        ...(signal ? { signal } : {}),
      });
    },

    plans(signal?: AbortSignal): Promise<SubscriptionPlan[]> {
      return http.get<SubscriptionPlan[]>(API_ROUTES.billing.plans, {
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type BillingResource = ReturnType<typeof createBillingResource>;
