import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CreateReviewBody, ListReviewsParams } from '@talpio/api-client';
import { PAGINATION, queryKeys } from '@talpio/config';
import type { ProviderSummary, Review } from '@talpio/types';

import { apiClient } from '@/lib/api';

/** Oturumdaki tarafın değerlendirmeleri: müşteri yazdıklarını, satıcı aldıklarını görür. */
export function useMyReviewsInfinite(params: Omit<ListReviewsParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.mine(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.reviews.listMine(
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

/** Satıcının herkese açık yorumları; oturum gerektirmez. */
export function useProviderReviewsInfinite(providerId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.reviews.forProvider(providerId),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.reviews.listForProvider(
        providerId,
        { page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    enabled: providerId.length > 0,
  });
}

export function useProvider(id: string) {
  return useQuery<ProviderSummary>({
    queryKey: queryKeys.providers.detail(id),
    queryFn: ({ signal }) => apiClient.providers.getById(id, signal),
    enabled: id.length > 0,
  });
}

/**
 * Bir siparişin değerlendirmesi. İş onaylanana kadar yorum yoktur; bu yüzden
 * boş sonuç hata değil, beklenen bir durumdur.
 */
export function useReviewForOrder(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.reviews.forOrder(orderId),
    queryFn: ({ signal }) => apiClient.reviews.listMine({ orderId, limit: 1 }, signal),
    select: (page): Review | null => page.items[0] ?? null,
    enabled: enabled && orderId.length > 0,
  });
}

/**
 * Yorum satıcının ortalama puanını da değiştirir; bu yüzden başarıdan sonra satıcı
 * kartını taşıyan sorgular da geçersizlenir.
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateReviewBody) => apiClient.reviews.create(body),
    onSuccess: (review) => {
      queryClient.setQueryData(queryKeys.reviews.detail(review.id), review);
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.providers.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
}

export function useReplyToReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, body }: { reviewId: string; body: string }) =>
      apiClient.reviews.reply(reviewId, body),
    onSuccess: (review) => {
      queryClient.setQueryData(queryKeys.reviews.detail(review.id), review);
      void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all() });
    },
  });
}

export function flattenReviewPages(pages: { items: Review[] }[] | undefined): Review[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
