'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AcceptOfferBody, ListOffersParams } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';

import { apiClient } from '@/lib/api';

/** Satıcının kendi verdiği teklifler. */
export function useMyOffers(params: ListOffersParams = {}) {
  return useQuery({
    queryKey: queryKeys.offers.mine(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.offers.listMine(params, signal),
  });
}

export function useJobOffers(jobId: string, params: ListOffersParams = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.offers(jobId),
    queryFn: ({ signal }) => apiClient.offers.listForJob(jobId, params, signal),
    enabled: jobId.length > 0,
  });
}

/**
 * Teklif kabulü işi de değiştirir: talep "satıcı seçildi" durumuna geçer ve rakip
 * teklifler düşer. Bu yüzden hem teklif hem talep sorguları geçersizlenir.
 */
export function useAcceptOffer(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, ...body }: AcceptOfferBody & { offerId: string }) =>
      apiClient.offers.accept(offerId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.offers(jobId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
    },
  });
}

export function useRejectOffer(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason?: string }) =>
      apiClient.offers.reject(offerId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.offers(jobId) });
    },
  });
}
