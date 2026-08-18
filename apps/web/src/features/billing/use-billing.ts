'use client';

import { queryKeys } from '@talpio/config';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api';

export function useAiCredits(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.credits(),
    queryFn: ({ signal }) => apiClient.billing.credits(signal),
    enabled,
    staleTime: 30_000,
  });
}

export function useBillingPlans(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.plans(),
    queryFn: ({ signal }) => apiClient.billing.plans(signal),
    enabled,
    staleTime: 60_000,
  });
}
