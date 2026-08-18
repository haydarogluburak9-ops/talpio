import {
  CURRENCY_MINOR_UNITS,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_CURRENCY,
  DEFAULT_PHONE_COUNTRY_CODE,
  DEFAULT_TIMEZONE,
} from '@talpio/config';

/**
 * Çok ülkeli genişleme noktaları. Ülkeye özgü vergi oranı veya stopaj
 * buraya gömülmez; vergi hesaplayan adaptör ayrı bağlanır.
 */
export interface TaxCalculationInput {
  amountMinor: number;
  currency: string;
  countryCode: string;
}

export interface TaxCalculationResult {
  taxMinor: number;
  taxCode: string;
}

/** Varsayılan: vergi uygulanmaz. Ülke kuralı eklenene kadar 0 döner. */
export type TaxAdapter = (input: TaxCalculationInput) => TaxCalculationResult;

export const noopTaxAdapter: TaxAdapter = () => ({ taxMinor: 0, taxCode: 'UNSET' });

export const LOCALE_EXTENSION_DEFAULTS = {
  countryCode: DEFAULT_COUNTRY_CODE,
  currency: DEFAULT_CURRENCY,
  timezone: DEFAULT_TIMEZONE,
  phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
} as const;

export function isKnownCurrency(currency: string): boolean {
  return currency in CURRENCY_MINOR_UNITS;
}

/** E.164 iskeleti: + ve rakam. Ülke numaralandırma planı uydurulmaz. */
export function looksLikeE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
