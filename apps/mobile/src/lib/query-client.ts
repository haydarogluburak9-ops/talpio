import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@ustapilot/api-client';

/**
 * Mobilde ağ dalgalanması masaüstünden daha sık; bu yüzden geçici hatalarda
 * yeniden denenir, ancak istemci hataları (4xx) tekrar denenmez.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
