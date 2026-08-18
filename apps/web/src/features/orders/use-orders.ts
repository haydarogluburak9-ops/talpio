'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListOrdersParams } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { Order } from '@talpio/types';

import { apiClient } from '@/lib/api';

export function useMyOrders(params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.orders.listMine(params, signal),
  });
}

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: queryKeys.orders.detail(id),
    queryFn: ({ signal }) => apiClient.orders.getById(id, signal),
    enabled: id.length > 0,
  });
}

/**
 * Sipariş adımları işin durumunu da değiştirir; bu yüzden başarıdan sonra hem
 * sipariş hem talep sorguları geçersizlenir.
 */
function useOrderAction<TArgs>(id: string, run: (args: TArgs) => Promise<Order>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: run,
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
    },
  });
}

export function usePayOrder(id: string) {
  // Ağ tekrarında ikinci tahsilatı önlemek için anahtar sipariş kimliğinden türetilir.
  return useOrderAction(id, () => apiClient.orders.pay(id, { idempotencyKey: `web-${id}` }));
}

export function useStartOrder(id: string) {
  return useOrderAction(id, () => apiClient.orders.start(id));
}

export function useCompleteOrder(id: string) {
  return useOrderAction(id, (note?: string) => apiClient.orders.complete(id, note));
}

export function useApproveOrder(id: string) {
  return useOrderAction(id, () => apiClient.orders.approve(id));
}

export function useCancelOrder(id: string) {
  return useOrderAction(id, (reason?: string) => apiClient.orders.cancel(id, reason));
}
