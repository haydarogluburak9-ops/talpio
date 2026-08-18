'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';

import { apiClient } from '@/lib/api-client';

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.system.status(),
    queryFn: ({ signal }) => apiClient.health.status(signal),
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useQueueHealth() {
  return useQuery({
    queryKey: queryKeys.system.queues(),
    queryFn: ({ signal }) => apiClient.health.queues(signal),
    refetchInterval: 30_000,
    retry: 1,
  });
}
