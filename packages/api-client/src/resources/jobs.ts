import { API_ROUTES } from '@ustapilot/config';
import type { JobRequest, JobRequestStatus } from '@ustapilot/types';
import type { CreateJobRequestPayload } from '@ustapilot/validation';

import type { HttpClient, Paginated } from '../http-client';

export interface ListJobsParams {
  page?: number;
  limit?: number;
  status?: JobRequestStatus[];
  categoryId?: string;
  sort?: string;
}

export interface AvailableJobsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  districtId?: string;
  isUrgent?: boolean;
  /** Kapatılırsa ustanın hizmet kategorileri ve bölgeleri dışındaki işler de gelir. */
  matchMyServices?: boolean;
}

/** Talep gövdesi; `publish` yanlış verilirse talep taslak olarak kaydedilir. */
export type CreateJobBody = CreateJobRequestPayload & { publish?: boolean };

export function createJobsResource(http: HttpClient) {
  return {
    create(body: CreateJobBody, signal?: AbortSignal): Promise<JobRequest> {
      return http.post<JobRequest>(API_ROUTES.jobs.root, body, {
        ...(signal ? { signal } : {}),
      });
    },

    listMine(params: ListJobsParams = {}, signal?: AbortSignal): Promise<Paginated<JobRequest>> {
      return http.paginated<JobRequest>(API_ROUTES.jobs.root, {
        method: 'GET',
        query: { ...params, status: params.status?.join(',') },
        ...(signal ? { signal } : {}),
      });
    },

    listAvailable(
      params: AvailableJobsParams = {},
      signal?: AbortSignal,
    ): Promise<Paginated<JobRequest>> {
      return http.paginated<JobRequest>(API_ROUTES.jobs.available, {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    getById(id: string, signal?: AbortSignal): Promise<JobRequest> {
      return http.get<JobRequest>(API_ROUTES.jobs.byId(id), { ...(signal ? { signal } : {}) });
    },

    publish(id: string): Promise<JobRequest> {
      return http.post<JobRequest>(API_ROUTES.jobs.publish(id));
    },

    cancel(id: string, reason?: string): Promise<JobRequest> {
      return http.post<JobRequest>(API_ROUTES.jobs.cancel(id), reason ? { reason } : {});
    },
  };
}

export type JobsResource = ReturnType<typeof createJobsResource>;
