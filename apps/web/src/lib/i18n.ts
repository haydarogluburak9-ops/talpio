import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@talpio/config';
import { createTranslator, localizedCategoryName, toLocaleTag } from '@talpio/localization';

import { publicEnv } from './env';

let currentLocale: SupportedLocale = isSupportedLocale(publicEnv.defaultLocale)
  ? publicEnv.defaultLocale
  : DEFAULT_LOCALE;

const listeners = new Set<() => void>();

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function hydrateLocale(locale: SupportedLocale) {
  if (currentLocale === locale) return;
  currentLocale = locale;
  listeners.forEach((listener) => listener());
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function t(key: string, params?: Record<string, string | number>): string {
  return createTranslator(currentLocale).t(key, params);
}

export function localeTag(): string {
  return toLocaleTag(currentLocale);
}

export function categoryLabel(slug: string, fallback: string): string {
  return localizedCategoryName(slug, currentLocale, fallback);
}
