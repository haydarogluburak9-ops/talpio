'use client';

import { useQuery } from '@tanstack/react-query';
import type { ListPaymentsParams, ListTransactionsParams } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { Payment } from '@talpio/types';

import { apiClient } from '@/lib/api';

export function useMyPayments(params: ListPaymentsParams = {}) {
  return useQuery({
    queryKey: queryKeys.payments.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.payments.listMine(params, signal),
  });
}

/**
 * Bir siparişin ödemesi. Ödeme alınmadan önce kayıt yoktur; boş sonuç hata
 * değil, beklenen durumdur.
 */
export function usePaymentForOrder(orderId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.payments.forOrder(orderId),
    queryFn: ({ signal }) => apiClient.payments.listMine({ orderId, limit: 1 }, signal),
    select: (page): Payment | null => page.items[0] ?? null,
    enabled: enabled && orderId.length > 0,
  });
}

export function useMyTransactions(params: ListTransactionsParams = {}) {
  return useQuery({
    queryKey: queryKeys.payments.transactions(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.payments.listTransactions(params, signal),
  });
}

export function useProviderWallet() {
  return useQuery({
    queryKey: queryKeys.payments.wallet(),
    queryFn: ({ signal }) => apiClient.payments.wallet(signal),
  });
}
