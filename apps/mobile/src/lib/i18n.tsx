import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';

import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@ustapilot/config';
import { createTranslator, type Translator } from '@ustapilot/localization';

interface I18nValue extends Translator {
  setLocale: (locale: SupportedLocale) => void;
}

/** Cihaz dili desteklenenler arasındaysa kullanılır, değilse varsayılana düşer. */
function deviceLocale(): SupportedLocale {
  const tag = getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
  return isSupportedLocale(tag) ? tag : DEFAULT_LOCALE;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(deviceLocale);

  const value = useMemo<I18nValue>(
    () => ({ ...createTranslator(locale), setLocale }),
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
