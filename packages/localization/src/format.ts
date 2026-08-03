import { DEFAULT_CURRENCY, DEFAULT_LOCALE, minorUnitFactor } from '@ustapilot/config';
import type { Money } from '@ustapilot/types';

const localeTags: Record<string, string> = { tr: 'tr-TR', en: 'en-US' };

function toLocaleTag(locale: string): string {
  return localeTags[locale] ?? locale;
}

/**
 * Kuruş cinsinden tam sayıyı para birimine çevirir. Tutarlar hiçbir yerde
 * kayan noktalı saklanmadığı için dönüşüm yalnızca gösterim anında yapılır.
 */
export function formatMoneyMinor(
  amountMinor: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  const value = amountMinor / minorUnitFactor(currency);
  return new Intl.NumberFormat(toLocaleTag(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatMoney(money: Money, locale: string = DEFAULT_LOCALE): string {
  return formatMoneyMinor(money.amountMinor, money.currency, locale);
}

export function formatNumber(value: number, locale: string = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(toLocaleTag(locale)).format(value);
}

export function formatDate(
  value: string | Date,
  locale: string = DEFAULT_LOCALE,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(toLocaleTag(locale), options).format(date);
}

export function formatDateTime(value: string | Date, locale: string = DEFAULT_LOCALE): string {
  return formatDate(value, locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(value: string | Date, locale: string = DEFAULT_LOCALE): string {
  return formatDate(value, locale, { hour: '2-digit', minute: '2-digit' });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
];

/** "3 saat önce" gibi göreli zaman. Listelerde mutlak tarihten daha okunur. */
export function formatRelativeTime(
  value: string | Date,
  locale: string = DEFAULT_LOCALE,
  now: Date = new Date(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = date.getTime() - now.getTime();
  const formatter = new Intl.RelativeTimeFormat(toLocaleTag(locale), { numeric: 'auto' });

  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (Math.abs(diffMs) >= unitMs) {
      return formatter.format(Math.round(diffMs / unitMs), unit);
    }
  }

  return formatter.format(Math.round(diffMs / 1000), 'second');
}

/** Dakika cinsinden süreyi "2 sa 30 dk" biçiminde yazar. */
export function formatDuration(minutes: number, locale: string = DEFAULT_LOCALE): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  const labels =
    locale === 'en' ? { hour: 'h', minute: 'min' } : { hour: 'sa', minute: 'dk' };

  if (hours === 0) return `${remaining} ${labels.minute}`;
  if (remaining === 0) return `${hours} ${labels.hour}`;
  return `${hours} ${labels.hour} ${remaining} ${labels.minute}`;
}

export function formatRating(rating: number | null | undefined, locale = DEFAULT_LOCALE): string {
  if (rating == null) return '—';
  return new Intl.NumberFormat(toLocaleTag(locale), {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}
