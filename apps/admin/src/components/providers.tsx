'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SupportedLocale } from '@talpio/config';
import { useState, type ReactNode } from 'react';

import { I18nProvider } from '@/components/i18n-provider';
import { ApiError } from '@/lib/api-client';

export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: SupportedLocale;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
    </QueryClientProvider>
  );
}
