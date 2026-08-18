import { API_ROUTES } from '@talpio/config';
import type { Offer, OfferStatus } from '@talpio/types';
import type { CreateOfferPayload } from '@talpio/validation';

import type { HttpClient, Paginated } from '../http-client';

export interface ListOffersParams {
  page?: number;
  limit?: number;
  status?: OfferStatus[];
  sort?: string;
}

export type CreateOfferBody = CreateOfferPayload;

export interface AcceptOfferBody {
  /** Kararlaştırılan randevu zamanı. Verilmezse sipariş zamansız açılır. */
  scheduledAt?: string;
}

export function createOffersResource(http: HttpClient) {
  return {
    create(body: CreateOfferBody, signal?: AbortSignal): Promise<Offer> {
      return http.post<Offer>(API_ROUTES.offers.root, body, {
        ...(signal ? { signal } : {}),
      });
    },

    /** Satıcının verdiği teklifler. */
    listMine(params: ListOffersParams = {}, signal?: AbortSignal): Promise<Paginated<Offer>> {
      return http.paginated<Offer>(API_ROUTES.offers.mine, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    /** Bir talebe gelen teklifler. Yalnızca talep sahibi çağırabilir. */
    listForJob(
      jobId: string,
      params: ListOffersParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Offer>> {
      return http.paginated<Offer>(API_ROUTES.jobs.offers(jobId), {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    getById(id: string, signal?: AbortSignal): Promise<Offer> {
      return http.get<Offer>(API_ROUTES.offers.byId(id), { ...(signal ? { signal } : {}) });
    },

    accept(id: string, body: AcceptOfferBody = {}): Promise<Offer> {
      return http.post<Offer>(API_ROUTES.offers.accept(id), body);
    },

    reject(id: string, reason?: string): Promise<Offer> {
      return http.post<Offer>(API_ROUTES.offers.reject(id), reason ? { reason } : {});
    },

    withdraw(id: string): Promise<Offer> {
      return http.post<Offer>(API_ROUTES.offers.withdraw(id));
    },
  };
}

export type OffersResource = ReturnType<typeof createOffersResource>;
