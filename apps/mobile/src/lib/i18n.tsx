import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';

import { DEFAULT_LOCALE, LOCALE_COOKIE, isSupportedLocale, type SupportedLocale } from '@talpio/config';
import { catalogName, createTranslator, type Translator } from '@talpio/localization';
import type { LocalizedName } from '@talpio/types';

import { apiClient } from '@/lib/api';
import { env } from '@/lib/env';
import { secureStorage } from '@/lib/secure-storage';

interface I18nValue extends Translator {
  setLocale: (locale: SupportedLocale) => void;
  /** Kategori / alt kategori adını aktif dile indirger. */
  categoryName: (value: LocalizedName & { slug?: string }) => string;
}

function fallbackLocale(): SupportedLocale {
  return isSupportedLocale(env.defaultLocale) ? env.defaultLocale : DEFAULT_LOCALE;
}

/** Cihaz dili desteklenenler arasındaysa kullanılır, değilse varsayılana düşer. */
function deviceLocale(): SupportedLocale {
  const tag = getLocales()[0]?.languageCode ?? fallbackLocale();
  return isSupportedLocale(tag) ? tag : fallbackLocale();
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(deviceLocale);

  useEffect(() => {
    void secureStorage.getItem(LOCALE_COOKIE).then((stored) => {
      const next = stored && isSupportedLocale(stored) ? stored : deviceLocale();
      setLocaleState(next);
      apiClient.setLocale(next);
    });
  }, []);

  const setLocale = (next: SupportedLocale) => {
    setLocaleState(next);
    apiClient.setLocale(next);
    void secureStorage.setItem(LOCALE_COOKIE, next);
  };

  const value = useMemo<I18nValue>(
    () => ({
      ...createTranslator(locale),
      setLocale,
      categoryName: (value) => catalogName(value, locale),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n, I18nProvider içinde kullanılmalıdır.');
  return context;
}

/** Sadece çeviri fonksiyonuna ihtiyaç duyan bileşenler için kısayol. */
export function useT(): Translator['t'] {
  return useI18n().t;
}
