import { API_ROUTES } from '@ustapilot/config';
import type { Order, OrderStatus } from '@ustapilot/types';

import type { HttpClient, Paginated } from '../http-client';

export interface ListOrdersParams {
  page?: number;
  limit?: number;
  status?: OrderStatus[];
  /** Bir talebin siparişini bulmak için. */
  jobRequestId?: string;
  sort?: string;
}

export interface PayOrderBody {
  /** Aynı ödemenin iki kez alınmasını engelleyen istemci anahtarı. */
  idempotencyKey?: string;
  scheduledAt?: string;
}

export function createOrdersResource(http: HttpClient) {
  return {
    /** Oturumdaki tarafın siparişleri: müşteri verdiği, usta üstlendiği işleri görür. */
    listMine(params: ListOrdersParams = {}, signal?: AbortSignal): Promise<Paginated<Order>> {
      return http.paginated<Order>(API_ROUTES.orders.root, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    getById(id: string, signal?: AbortSignal): Promise<Order> {
      return http.get<Order>(API_ROUTES.orders.byId(id), { ...(signal ? { signal } : {}) });
    },

    pay(id: string, body: PayOrderBody = {}): Promise<Order> {
      return http.post<Order>(API_ROUTES.orders.pay(id), body);
    },

    start(id: string): Promise<Order> {
      return http.post<Order>(API_ROUTES.orders.start(id));
    },

    complete(id: string, note?: string): Promise<Order> {
      return http.post<Order>(API_ROUTES.orders.complete(id), note ? { note } : {});
    },

    approve(id: string): Promise<Order> {
      return http.post<Order>(API_ROUTES.orders.approve(id));
    },

    cancel(id: string, reason?: string): Promise<Order> {
      return http.post<Order>(API_ROUTES.orders.cancel(id), reason ? { reason } : {});
    },
  };
}

export type OrdersResource = ReturnType<typeof createOrdersResource>;
