'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateReviewBody,
  ListProviderReviewsParams,
  ListReviewsParams,
} from '@ustapilot/api-client';
import { queryKeys } from '@ustapilot/config';
import type { Review } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/** Oturumdaki tarafın değerlendirmeleri: müşteri yazdıklarını, usta aldıklarını görür. */
export function useMyReviews(params: ListReviewsParams = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.mine(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.reviews.listMine(params, signal),
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

export function useProviderReviews(providerId: string, params: ListProviderReviewsParams = {}) {
  return useQuery({
    queryKey: queryKeys.reviews.forProvider(providerId, params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.reviews.listForProvider(providerId, params, signal),
    enabled: providerId.length > 0,
  });
}

/**
 * Yorum ustanın ortalama puanını da değiştirir; bu yüzden başarıdan sonra usta
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
