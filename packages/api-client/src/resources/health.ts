import { API_ROUTES } from '@talpio/config';

import type { HttpClient } from '../http-client';

export interface HealthComponent {
  key: string;
  isUp: boolean;
  responseTimeMs?: number;
  message?: string;
}

export interface SystemHealth {
  isHealthy: boolean;
  components: HealthComponent[];
}

/** Terminus'un ham çıktısı. Zarf kullanmaz; izleme araçları bu biçimi bekler. */
interface TerminusResponse {
  status: 'ok' | 'error' | 'shutting_down';
  info?: Record<string, { status: string; responseTimeMs?: number; message?: string }>;
  error?: Record<string, { status: string; responseTimeMs?: number; message?: string }>;
  details?: Record<string, { status: string; responseTimeMs?: number; message?: string }>;
}

/**
 * Sağlık uçları izleme araçlarının bulabilmesi için API ön ekinin (`/api/v1`)
 * dışında yayınlanır; bu yüzden sunucu kökünden çağrılır.
 */
export function createHealthResource(http: HttpClient) {
  return {
    async ready(signal?: AbortSignal): Promise<SystemHealth> {
      const payload = await http.get<TerminusResponse>(`${http.origin}${API_ROUTES.health.ready}`, {
        raw: true,
        // Bozuk durumda 503 döner ama gövdesi hâlâ anlamlıdır.
        acceptStatuses: [200, 503],
        ...(signal ? { signal } : {}),
      });

      const details = payload.details ?? { ...payload.info, ...payload.error };

      return {
        isHealthy: payload.status === 'ok',
        components: Object.entries(details).map(([key, value]) => ({
          key,
          isUp: value.status === 'up',
          ...(value.responseTimeMs !== undefined ? { responseTimeMs: value.responseTimeMs } : {}),
          ...(value.message !== undefined ? { message: value.message } : {}),
        })),
      };
    },

    metrics(signal?: AbortSignal) {
      return http.get<Record<string, unknown>>(`${http.origin}${API_ROUTES.health.metrics}`, {
        raw: true,
        ...(signal ? { signal } : {}),
      });
    },

    async status(signal?: AbortSignal): Promise<SystemHealth> {
      const payload = await http.get<TerminusResponse>(`${http.origin}${API_ROUTES.health.status}`, {
        raw: true,
        acceptStatuses: [200, 503],
        ...(signal ? { signal } : {}),
      });
      const details = payload.details ?? { ...payload.info, ...payload.error };
      return {
        isHealthy: payload.status === 'ok',
        components: Object.entries(details).map(([key, value]) => ({
          key,
          isUp: value.status === 'up',
          ...(value.responseTimeMs !== undefined ? { responseTimeMs: value.responseTimeMs } : {}),
          ...(value.message !== undefined ? { message: value.message } : {}),
        })),
      };
    },

    queues(signal?: AbortSignal) {
      return http.get<{
        generatedAt: string;
        worker: { alive: boolean; heartbeat: { at: string; pid: number; queues: string[] } | null };
        queues: Record<string, { waiting: number; active: number; failed: number }>;
        deadLetters: Array<{
          id: string;
          sourceQueue: string;
          originalJobId: string;
          failedReason: string;
          attemptsMade: number;
          failedAt: string;
        }>;
        staleUnnotifiedMatches: number;
        outboxPending: number;
        outboxFailed: number;
      }>(`${http.origin}${API_ROUTES.health.queues}`, {
        raw: true,
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type HealthResource = ReturnType<typeof createHealthResource>;
