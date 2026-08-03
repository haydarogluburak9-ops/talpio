import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateOfferBody, ListOffersParams } from '@ustapilot/api-client';
import { PAGINATION, queryKeys } from '@ustapilot/config';
import type { Offer } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/** Ustanın verdiği teklifler. */
export function useMyOffersInfinite(params: Omit<ListOffersParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.offers.mine(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.offers.listMine(
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

/** Müşterinin bir talebine gelen teklifler. */
export function useJobOffersInfinite(jobId: string, params: Omit<ListOffersParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.jobs.offers(jobId),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.offers.listForJob(
        jobId,
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: jobId.length > 0,
  });
}

export function useOffer(id: string) {
  return useQuery<Offer>({
    queryKey: queryKeys.offers.detail(id),
    queryFn: ({ signal }) => apiClient.offers.getById(id, signal),
    enabled: id.length > 0,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateOfferBody) => apiClient.offers.create(body),
    onSuccess: (offer) => {
      queryClient.setQueryData(queryKeys.offers.detail(offer.id), offer);
      void queryClient.invalidateQueries({ queryKey: queryKeys.offers.all() });
      // Teklif verilen iş havuzdan düşer ve talebin teklif sayacı artar.
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
    },
  });
}

/**
 * Teklif kabulü talebi de değiştirir: usta seçilir ve rakip teklifler düşer.
 * Bu yüzden hem teklif hem talep sorguları geçersizlenir.
 */
export function useAcceptOffer(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => apiClient.offers.accept(offerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.offers.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.offers(jobId) });
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

export function useWithdrawOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => apiClient.offers.withdraw(offerId),
    onSuccess: (offer) => {
      queryClient.setQueryData(queryKeys.offers.detail(offer.id), offer);
      void queryClient.invalidateQueries({ queryKey: queryKeys.offers.all() });
    },
  });
}

export function flattenOfferPages(pages: { items: Offer[] }[] | undefined): Offer[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
