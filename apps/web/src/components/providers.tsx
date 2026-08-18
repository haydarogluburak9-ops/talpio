'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@talpio/api-client';
import type { SupportedLocale } from '@talpio/config';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { I18nProvider } from '@/components/i18n-provider';
import { RealtimeSyncProvider } from '@/components/realtime-sync-provider';

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
              // Yetki ve doğrulama hatalarında yeniden denemek anlamsızdır.
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
      <I18nProvider initialLocale={initialLocale}>
        <RealtimeSyncProvider>{children}</RealtimeSyncProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
