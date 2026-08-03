import { API_ROUTES } from '@ustapilot/config';
import type { Review, ReviewRatings } from '@ustapilot/types';

import type { HttpClient, Paginated } from '../http-client';

export interface ListReviewsParams {
  page?: number;
  limit?: number;
  /** Bir siparişin değerlendirmesini bulmak için. */
  orderId?: string;
  sort?: string;
}

export interface ListProviderReviewsParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreateReviewBody {
  orderId: string;
  ratings: ReviewRatings;
  comment?: string;
  photoFileIds?: string[];
}

export function createReviewsResource(http: HttpClient) {
  return {
    /** Müşteri tamamlanmış bir işi değerlendirir. */
    create(body: CreateReviewBody): Promise<Review> {
      return http.post<Review>(API_ROUTES.reviews.root, body);
    },

    /** Oturumdaki tarafın değerlendirmeleri: müşteri yazdıklarını, usta aldıklarını görür. */
    listMine(params: ListReviewsParams = {}, signal?: AbortSignal): Promise<Paginated<Review>> {
      return http.paginated<Review>(API_ROUTES.reviews.root, {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    /** Ustanın herkese açık yorumları; oturum gerektirmez. */
    listForProvider(
      providerId: string,
      params: ListProviderReviewsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<Review>> {
      return http.paginated<Review>(API_ROUTES.providers.reviews(providerId), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    getById(id: string, signal?: AbortSignal): Promise<Review> {
      return http.get<Review>(API_ROUTES.reviews.byId(id), { ...(signal ? { signal } : {}) });
    },

    reply(id: string, body: string): Promise<Review> {
      return http.post<Review>(API_ROUTES.reviews.reply(id), { body });
    },
  };
}

export type ReviewsResource = ReturnType<typeof createReviewsResource>;
