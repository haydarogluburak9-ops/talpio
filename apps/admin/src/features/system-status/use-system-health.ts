'use client';

import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api-client';

export type ComponentState = 'up' | 'down';

export interface HealthCheckResponse {
  status: 'ok' | 'error' | 'shutting_down';
  info: Record<string, { status: ComponentState; responseTimeMs?: number; message?: string }>;
  error: Record<string, { status: ComponentState; message?: string }>;
  details: Record<string, { status: ComponentState; responseTimeMs?: number; message?: string }>;
}

/**
 * Sağlık uçları API ön ekinin (`/api/v1`) dışındadır; bu yüzden kök adres türetilir.
 */
function healthUrl(path: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
  const origin = new URL(apiUrl).origin;
  return `${origin}${path}`;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const result = await apiRequest<HealthCheckResponse>(healthUrl('/health/ready'), {
        raw: true,
        // Bir bileşen kapalıyken 503 döner; gövde hangi bileşenin bozuk olduğunu içerir.
        acceptStatuses: [503],
      });
      return result.data;
    },
    refetchInterval: 30_000,
    retry: 1,
  });
}
