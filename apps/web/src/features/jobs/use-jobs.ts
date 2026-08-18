'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateJobBody, ListJobsParams } from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { JobRequest } from '@talpio/types';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api';

export function useMyJobs(params: ListJobsParams = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.list(params as Record<string, unknown>),
    queryFn: ({ signal }) => apiClient.jobs.listMine(params, signal),
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
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateJobBody) => apiClient.jobs.create(body),
    onSuccess: (job) => {
      queryClient.setQueryData(queryKeys.jobs.detail(job.id), job);
      void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all() });
      router.push(`/taleplerim/${job.id}`);
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
