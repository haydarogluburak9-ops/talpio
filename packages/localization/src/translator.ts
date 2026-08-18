import { DEFAULT_LOCALE, isSupportedLocale } from '@talpio/config';
import type { SupportedLocale } from '@talpio/config';

import { ar } from './locales/ar';
import { de } from './locales/de';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { tr } from './locales/tr';
import type { Messages } from './locales/tr';

export type { Messages };

export const catalogs: Record<SupportedLocale, Messages> = { en, tr, de, es, fr, ar };

export function messagesFor(locale: string): Messages {
  return isSupportedLocale(locale) ? catalogs[locale] : catalogs[DEFAULT_LOCALE];
}

/** "{count} teklif" gibi yer tutucuları doldurur. */
export function interpolate(
  template: string,
  params: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export interface Translator {
  locale: SupportedLocale;
  messages: Messages;
  /** Nokta ile ayrılmış anahtar: `t('home.heroTitle')` */
  t(key: string, params?: Record<string, string | number>): string;
}

export function createTranslator(locale: string): Translator {
  const resolved: SupportedLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = catalogs[resolved];

  return {
    locale: resolved,
    messages,
    t(key, params) {
      const value = key
        .split('.')
        .reduce<unknown>(
          (node, segment) =>
            typeof node === 'object' && node !== null
              ? (node as Record<string, unknown>)[segment]
              : undefined,
          messages,
        );

      // Eksik anahtar sessizce kaybolmasın; anahtarın kendisi görünür kalsın.
      if (typeof value !== 'string') return key;
      return interpolate(value, params);
    },
  };
}
