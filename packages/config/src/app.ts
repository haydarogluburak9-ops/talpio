export const APP_NAME = 'Talpio';
export const APP_TAGLINE_TR = 'Talebinizi yayınlayın. Doğru teklifi alın.';
export const APP_TAGLINE_EN = 'Publish your request. Get the right offer.';

export const SUPPORTED_LOCALES = ['en', 'tr', 'de', 'es', 'fr', 'ar'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_COOKIE = 'talpio_locale';

export const LOCALE_META: Record<
  SupportedLocale,
  { label: string; nativeLabel: string; dir: 'ltr' | 'rtl'; tag: string }
> = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', tag: 'en-US' },
  tr: { label: 'Turkish', nativeLabel: 'Türkçe', dir: 'ltr', tag: 'tr-TR' },
  de: { label: 'German', nativeLabel: 'Deutsch', dir: 'ltr', tag: 'de-DE' },
  es: { label: 'Spanish', nativeLabel: 'Español', dir: 'ltr', tag: 'es-ES' },
  fr: { label: 'French', nativeLabel: 'Français', dir: 'ltr', tag: 'fr-FR' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', tag: 'ar' },
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Konum / para birimi varsayılanları. Kullanıcı veya işletme ayarı yoksa
 * uygulanır; kodda şehre kilitli değildir.
 */
export const DEFAULT_COUNTRY_CODE = 'TR';
export const DEFAULT_CURRENCY = 'TRY';
export const DEFAULT_TIMEZONE = 'Europe/Istanbul';
export const DEFAULT_PHONE_COUNTRY_CODE = '+90';

export const CURRENCY_MINOR_UNITS: Record<string, number> = {
  TRY: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  AED: 2,
  JPY: 0,
  INR: 2,
  BRL: 2,
  EGP: 2,
  SGD: 2,
};

/** Verilen para biriminde 1 birimin kaç alt birime karşılık geldiği. */
export function minorUnitFactor(currency: string): number {
  const digits = CURRENCY_MINOR_UNITS[currency] ?? 2;
  return 10 ** digits;
}
