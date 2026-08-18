import { API_ROUTES } from '@talpio/config';
import type {
  Payment,
  PaymentStatus,
  ProviderWalletSummary,
  Transaction,
  TransactionType,
} from '@talpio/types';

import type { HttpClient, Paginated } from '../http-client';

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  status?: PaymentStatus[];
  /** Bir siparişin makbuzunu tek çağrıyla almak için. */
  orderId?: string;
  sort?: string;
}

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  type?: TransactionType[];
  orderId?: string;
  sort?: string;
}

export function createPaymentsResource(http: HttpClient) {
  return {
    /** Oturumdaki tarafın ödemeleri: müşteri yaptıklarını, satıcı aldıklarını görür. */
    listMine(params: ListPaymentsParams = {}, signal?: AbortSignal): Promise<Paginated<Payment>> {
      return http.paginated<Payment>(API_ROUTES.payments.root, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    getById(id: string, signal?: AbortSignal): Promise<Payment> {
      return http.get<Payment>(API_ROUTES.payments.byId(id), { ...(signal ? { signal } : {}) });
    },

    listTransactions(
      params: ListTransactionsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Transaction>> {
      return http.paginated<Transaction>(API_ROUTES.payments.transactions, {
        method: 'GET',
        query: { ...params, type: params.type?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    /** Satıcının kullanılabilir bakiyesi ve bloke hakedişi. */
    wallet(signal?: AbortSignal): Promise<ProviderWalletSummary> {
      return http.get<ProviderWalletSummary>(API_ROUTES.payments.wallet, {
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type PaymentsResource = ReturnType<typeof createPaymentsResource>;
