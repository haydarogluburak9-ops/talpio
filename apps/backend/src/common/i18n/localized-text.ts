import type { CategoryRef, LocalizedText } from '@talpio/types';

/**
 * Şemasız JSON sütunundan okunan görünen metni doğrular.
 *
 * Düz string olduğu gibi kabul edilir; sözlükte string olmayan ve boş diller
 * atılır, geriye hiç dil kalmazsa metin kullanılamaz sayılır (`undefined`).
 */
export function parseLocalizedText(value: unknown): LocalizedText | undefined {
  if (typeof value === 'string') return value.length > 0 ? value : undefined;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

  const translations: Record<string, string> = {};
  for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === 'string' && text.length > 0) translations[locale] = text;
  }

  return Object.keys(translations).length > 0 ? translations : undefined;
}

/**
 * Katalog adının çeviri sözlüğü. Sütun boş ya da bozuksa `null` döner ve
 * istemci Türkçe `name` sütununa düşer.
 */
export function parseNameTranslations(value: unknown): LocalizedText | null {
  return parseLocalizedText(value) ?? null;
}

/** Kategori referansı taşıyan Prisma select'lerinin ortak alan kümesi. */
export const categoryRefSelect = { id: true, name: true, nameTranslations: true } as const;

/** Kategori / alt kategori referansını çeviri sözlüğüyle birlikte döndürür. */
export function toCategoryRef(row: {
  id: string;
  name: string;
  nameTranslations: unknown;
}): CategoryRef {
  return {
    id: row.id,
    name: row.name,
    nameTranslations: parseNameTranslations(row.nameTranslations),
  };
}
