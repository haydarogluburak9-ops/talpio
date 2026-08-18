import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { ListPaymentsParams, ListTransactionsParams } from '@talpio/api-client';
import { PAGINATION, queryKeys } from '@talpio/config';
import type { Payment, Transaction } from '@talpio/types';

import { apiClient } from '@/lib/api';

/** Oturumdaki tarafın ödemeleri: müşteri yaptıklarını, satıcı aldıklarını görür. */
export function useMyPaymentsInfinite(params: Omit<ListPaymentsParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.payments.list(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.payments.listMine(
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useMyTransactionsInfinite(params: Omit<ListTransactionsParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.payments.transactions(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.payments.listTransactions(
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

/**
 * Bir siparişin ödemesi. Tahsilat denenmeden kayıt oluşmaz; boş sonuç hata
 * değil, beklenen bir durumdur.
 */
export function usePaymentForOrder(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.payments.forOrder(orderId),
    queryFn: ({ signal }) => apiClient.payments.listMine({ orderId, limit: 1 }, signal),
    select: (page): Payment | null => page.items[0] ?? null,
    enabled: enabled && orderId.length > 0,
  });
}

export function useProviderWallet() {
  return useQuery({
    queryKey: queryKeys.payments.wallet(),
    queryFn: ({ signal }) => apiClient.payments.wallet(signal),
  });
}

export function flattenPaymentPages(pages: { items: Payment[] }[] | undefined): Payment[] {
  return pages?.flatMap((page) => page.items) ?? [];
}

export function flattenTransactionPages(
  pages: { items: Transaction[] }[] | undefined,
): Transaction[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
