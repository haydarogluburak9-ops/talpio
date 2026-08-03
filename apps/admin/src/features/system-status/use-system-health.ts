'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@ustapilot/config';

import { apiClient } from '@/lib/api-client';

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: ({ signal }) => apiClient.health.ready(signal),
    refetchInterval: 30_000,
    retry: 1,
  });
}
