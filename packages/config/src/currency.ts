/**
 * ISO 4217 para birimi kataloğu.
 *
 * Adlar burada tutulmaz. `Intl.DisplayNames` her dilde doğru adı zaten üretir;
 * 160 para biriminin adını altı dile elle çevirmek hem devasa bir tablo hem de
 * sürekli bayatlayan bir veri olurdu.
 *
 * Kuruş basamağı ise elle tutulur: bu sayı tutarı yorumlamak için gerekir ve
 * yanlış olduğunda sessizce 100 kat hatalı fiyat üretir. JPY'de kuruş yoktur,
 * KWD'de üç basamak vardır; ikisi de "her para biriminde 2 basamak" varsayan
 * koda karşı gerçek bir hata kaynağıdır.
 */

/** Kuruş basamağı 2'den farklı olan para birimleri. Listede olmayan her kod 2 kabul edilir. */
const NON_STANDARD_MINOR_UNITS: Record<string, number> = {
  // Kuruşsuz.
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  // Üç basamak.
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
};

/**
 * Desteklenen para birimleri.
 *
 * App Store Connect gibi geniş tutuldu: satıcı hangi ülkedeyse kendi para
 * biriminde fiyat verebilsin. Kısıtlı bir liste, listede olmayan ülkedeki
 * satıcıyı yabancı bir para biriminde fiyat vermeye zorlar.
 */
export const CURRENCY_CODES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
  'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
  'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
  'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD',
  'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
  'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF',
  'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD',
  'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR',
  'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD',
  'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON',
  'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP',
  'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SZL', 'THB', 'TJS', 'TMT',
  'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU',
  'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF', 'YER',
  'ZAR', 'ZMW', 'ZWG',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

const CURRENCY_SET: ReadonlySet<string> = new Set(CURRENCY_CODES);

/**
 * Öne çıkan para birimleri.
 *
 * Uzun listede aranan para birimi çoğu zaman bunlardan biri; seçicinin en
 * üstünde ayrı bir grup olarak gösterilir. Sıralama ticaret hacmine göre.
 */
export const POPULAR_CURRENCY_CODES = [
  'EUR',
  'USD',
  'GBP',
  'TRY',
  'AED',
  'CHF',
  'SAR',
  'CNY',
  'JPY',
] as const;

export function isKnownCurrency(currency: string): currency is CurrencyCode {
  return CURRENCY_SET.has(currency);
}

/** Verilen para biriminde 1 birimin kaç alt birime (kuruş) karşılık geldiği. */
export function currencyMinorDigits(currency: string): number {
  return NON_STANDARD_MINOR_UNITS[currency.toUpperCase()] ?? 2;
}

/**
 * Ülke → para birimi.
 *
 * Kullanıcı ülkesini seçtiğinde para birimi kendiliğinden gelsin diye var.
 * Ülkesi listede yoksa çağıran tarafın yedeğine düşülür; uydurma bir kod
 * döndürmek, biçimlendiricinin hata vermesine yol açardı.
 */
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  AD: 'EUR', AE: 'AED', AF: 'AFN', AG: 'XCD', AI: 'XCD', AL: 'ALL', AM: 'AMD',
  AO: 'AOA', AR: 'ARS', AT: 'EUR', AU: 'AUD', AW: 'AWG', AZ: 'AZN', BA: 'BAM',
  BB: 'BBD', BD: 'BDT', BE: 'EUR', BF: 'XOF', BG: 'BGN', BH: 'BHD', BI: 'BIF',
  BJ: 'XOF', BM: 'BMD', BN: 'BND', BO: 'BOB', BR: 'BRL', BS: 'BSD', BT: 'BTN',
  BW: 'BWP', BY: 'BYN', BZ: 'BZD', CA: 'CAD', CD: 'CDF', CF: 'XAF', CG: 'XAF',
  CH: 'CHF', CI: 'XOF', CL: 'CLP', CM: 'XAF', CN: 'CNY', CO: 'COP', CR: 'CRC',
  CU: 'CUP', CV: 'CVE', CY: 'EUR', CZ: 'CZK', DE: 'EUR', DJ: 'DJF', DK: 'DKK',
  DM: 'XCD', DO: 'DOP', DZ: 'DZD', EC: 'USD', EE: 'EUR', EG: 'EGP', ER: 'ERN',
  ES: 'EUR', ET: 'ETB', FI: 'EUR', FJ: 'FJD', FK: 'FKP', FM: 'USD', FR: 'EUR',
  GA: 'XAF', GB: 'GBP', GD: 'XCD', GE: 'GEL', GH: 'GHS', GI: 'GIP', GM: 'GMD',
  GN: 'GNF', GQ: 'XAF', GR: 'EUR', GT: 'GTQ', GW: 'XOF', GY: 'GYD', HK: 'HKD',
  HN: 'HNL', HR: 'EUR', HT: 'HTG', HU: 'HUF', ID: 'IDR', IE: 'EUR', IL: 'ILS',
  IN: 'INR', IQ: 'IQD', IR: 'IRR', IS: 'ISK', IT: 'EUR', JM: 'JMD', JO: 'JOD',
  JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KM: 'KMF', KN: 'XCD', KR: 'KRW',
  KW: 'KWD', KY: 'KYD', KZ: 'KZT', LA: 'LAK', LB: 'LBP', LC: 'XCD', LI: 'CHF',
  LK: 'LKR', LR: 'LRD', LS: 'LSL', LT: 'EUR', LU: 'EUR', LV: 'EUR', LY: 'LYD',
  MA: 'MAD', MC: 'EUR', MD: 'MDL', ME: 'EUR', MG: 'MGA', MK: 'MKD', ML: 'XOF',
  MM: 'MMK', MN: 'MNT', MO: 'MOP', MR: 'MRU', MT: 'EUR', MU: 'MUR', MV: 'MVR',
  MW: 'MWK', MX: 'MXN', MY: 'MYR', MZ: 'MZN', NA: 'NAD', NC: 'XPF', NE: 'XOF',
  NG: 'NGN', NI: 'NIO', NL: 'EUR', NO: 'NOK', NP: 'NPR', NZ: 'NZD', OM: 'OMR',
  PA: 'PAB', PE: 'PEN', PF: 'XPF', PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN',
  PT: 'EUR', PY: 'PYG', QA: 'QAR', RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF',
  SA: 'SAR', SB: 'SBD', SC: 'SCR', SD: 'SDG', SE: 'SEK', SG: 'SGD', SI: 'EUR',
  SK: 'EUR', SL: 'SLE', SM: 'EUR', SN: 'XOF', SO: 'SOS', SR: 'SRD', SS: 'SSP',
  ST: 'STN', SV: 'SVC', SZ: 'SZL', TD: 'XAF', TG: 'XOF', TH: 'THB', TJ: 'TJS',
  TM: 'TMT', TN: 'TND', TO: 'TOP', TR: 'TRY', TT: 'TTD', TW: 'TWD', TZ: 'TZS',
  UA: 'UAH', UG: 'UGX', US: 'USD', UY: 'UYU', UZ: 'UZS', VA: 'EUR', VE: 'VES',
  VN: 'VND', VU: 'VUV', WS: 'WST', YE: 'YER', ZA: 'ZAR', ZM: 'ZMW', ZW: 'ZWG',
};

/**
 * Dil → para birimi.
 *
 * Ülke bilgisi yoksa son çare olarak kullanılır. Arapça için AED seçildi:
 * platformun Arapça konuşan kullanıcı kütlesi Körfez ticaretinde yoğunlaşıyor
 * ve bölgede fiyatlar çoğunlukla dirhem veya dolar üzerinden veriliyor.
 */
export const LOCALE_CURRENCY: Record<string, CurrencyCode> = {
  en: 'USD',
  tr: 'TRY',
  de: 'EUR',
  es: 'EUR',
  fr: 'EUR',
  ar: 'AED',
};

/**
 * Para biriminin o dildeki adı. Bilinmeyen kodda kodun kendisi döner.
 *
 * `Intl.DisplayNames` her ortamda bulunmayabilir (eski RN motorları); bu yüzden
 * çağrı korumalıdır ve başarısızlıkta kod gösterilir.
 */
export function currencyDisplayName(currency: string, locale: string): string {
  try {
    const names = new Intl.DisplayNames([locale], { type: 'currency' });
    return names.of(currency.toUpperCase()) ?? currency;
  } catch {
    return currency;
  }
}

/**
 * Para biriminin sembolü (₺, €, $ ...). Sembolü olmayan kodda kodun kendisi.
 *
 * Biçimlendiriciden çıkarılır: ayrı bir sembol tablosu tutmak, dile göre
 * değişen gösterimleri (ör. $ ve US$) ıskalardı.
 */
export function currencySymbol(currency: string, locale: string): string {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}
