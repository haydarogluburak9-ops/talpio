import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_META,
  isSupportedLocale,
  type SupportedLocale,
} from '@talpio/config';

export function resolveLocale(value?: string | null): SupportedLocale {
  if (value && isSupportedLocale(value)) return value;
  return DEFAULT_LOCALE;
}

export function localeFromAcceptLanguage(header?: string | null): SupportedLocale | null {
  if (!header) return null;
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase();
    if (!tag) continue;
    const short = tag.split('-')[0];
    if (short && isSupportedLocale(short)) return short;
  }
  return null;
}

export function persistLocale(locale: SupportedLocale) {
  if (typeof document === 'undefined') return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
  try {
    window.localStorage.setItem(LOCALE_COOKIE, locale);
  } catch {
    /* private mode */
  }
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALE_META[locale].dir;
}

export function readStoredLocale(): SupportedLocale | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(LOCALE_COOKIE);
    if (stored && isSupportedLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  return match ? resolveLocale(match[1]) : null;
}
