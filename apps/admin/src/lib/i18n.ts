import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@talpio/config';
import { createTranslator, toLocaleTag } from '@talpio/localization';

let currentLocale: SupportedLocale = DEFAULT_LOCALE;
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

export function isAdminLocale(value: string): value is SupportedLocale {
  return isSupportedLocale(value);
}
