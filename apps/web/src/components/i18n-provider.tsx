'use client';

import { type SupportedLocale } from '@talpio/config';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';

import { apiClient } from '@/lib/api';
import { getLocale, hydrateLocale, subscribeLocale } from '@/lib/i18n';
import { persistLocale } from '@/lib/locale';

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: SupportedLocale;
  children: ReactNode;
}) {
  if (getLocale() !== initialLocale) {
    hydrateLocale(initialLocale);
  }

  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => initialLocale);

  useEffect(() => {
    persistLocale(initialLocale);
    apiClient.setLocale(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    apiClient.setLocale(locale);
    persistLocale(locale);
  }, [locale]);

  return children;
}
