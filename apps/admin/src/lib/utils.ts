import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Koşullu sınıf birleştirme; çakışan Tailwind sınıflarını sonuncusu kazanacak şekilde çözer. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | Date, locale = 'tr-TR'): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Kuruş cinsinden tam sayı tutarı yerel para biçimine çevirir. */
export function formatMoney(amountMinor: number, currency = 'TRY', locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}
