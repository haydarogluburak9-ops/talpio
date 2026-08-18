import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ListOrdersParams } from '@talpio/api-client';
import { PAGINATION, queryKeys } from '@talpio/config';
import type { Order } from '@talpio/types';

import { apiClient } from '@/lib/api';

/** Oturumdaki tarafın siparişleri: müşteri verdiği, satıcı üstlendiği işleri görür. */
export function useMyOrdersInfinite(params: Omit<ListOrdersParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.orders.list(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.orders.listMine(
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

/**
 * Bir talebin siparişi. Teklif kabul edilene kadar sipariş yoktur; bu yüzden
 * boş sonuç hata değil, beklenen bir durumdur.
 */
export function useOrderForJob(jobRequestId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.orders.list({ jobRequestId }),
    queryFn: ({ signal }) => apiClient.orders.listMine({ jobRequestId, limit: 1 }, signal),
    select: (page): Order | null => page.items[0] ?? null,
    enabled: enabled && jobRequestId.length > 0,
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
  return useOrderAction(id, () => apiClient.orders.pay(id, { idempotencyKey: `mobile-${id}` }));
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

export function flattenOrderPages(pages: { items: Order[] }[] | undefined): Order[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
