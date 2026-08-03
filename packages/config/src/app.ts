export const APP_NAME = 'UstaPilot';
export const APP_TAGLINE_TR = 'Doğru usta. Doğru fiyat. Güvenli hizmet.';
export const APP_TAGLINE_EN = 'The right pro. The right price. Safe service.';

export const SUPPORTED_LOCALES = ['tr', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'tr';

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * İlk pazar Gaziantep'tir ancak hiçbir yerde koda gömülmez; bu değerler yalnızca
 * kullanıcı henüz bir konum seçmediğinde uygulanan varsayılanlardır ve sistem
 * ayarlarından değiştirilebilir.
 */
export const DEFAULT_COUNTRY_CODE = 'TR';
export const DEFAULT_CURRENCY = 'TRY';
export const DEFAULT_TIMEZONE = 'Europe/Istanbul';
export const DEFAULT_PHONE_COUNTRY_CODE = '+90';

export const CURRENCY_MINOR_UNITS: Record<string, number> = {
  TRY: 2,
  USD: 2,
  EUR: 2,
};

/** Verilen para biriminde 1 birimin kaç alt birime karşılık geldiği. */
export function minorUnitFactor(currency: string): number {
  const digits = CURRENCY_MINOR_UNITS[currency] ?? 2;
  return 10 ** digits;
}
