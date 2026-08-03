import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AvailableJobsParams, CreateJobBody, ListJobsParams } from '@ustapilot/api-client';
import { PAGINATION, queryKeys } from '@ustapilot/config';
import type { JobRequest } from '@ustapilot/types';

import { apiClient } from '@/lib/api';

/**
 * Sonsuz kaydırma için sayfa alınır. Backend `hasNextPage` bildirdiği için
 * sonraki sayfa numarası üst veriden türetilir; istemci toplamı hesaplamaz.
 */
export function useMyJobsInfinite(params: Omit<ListJobsParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.jobs.list(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.jobs.listMine({ ...params, page: pageParam, limit: PAGINATION.defaultLimit }, signal),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useAvailableJobsInfinite(params: Omit<AvailableJobsParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.jobs.available(params as Record<string, unknown>),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      apiClient.jobs.listAvailable(
        { ...params, page: pageParam, limit: PAGINATION.defaultLimit },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
  });
}

export function useJob(id: string) {
  return useQuery<JobRequest>({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: ({ signal }) => apiClient.jobs.getById(id, signal),
    enabled: id.length > 0,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateJobBody) => apiClient.jobs.create(body),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
    },
  });
}

export function useCancelJob(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => apiClient.jobs.cancel(id, reason),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
    },
  });
}

/** Sonsuz sorgunun sayfalarını tek listeye düzleştirir. */
export function flattenPages(
  pages: { items: JobRequest[] }[] | undefined,
): JobRequest[] {
  return pages?.flatMap((page) => page.items) ?? [];
}
