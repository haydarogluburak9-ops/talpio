import type { LocalizedName } from '@talpio/types';

import { resolveCategoryName } from './localized-text';
import { createTranslator } from './translator';

/** Katalog slug'ı için çevrilmiş ad; anahtar yoksa veritabanı adını kullanır. */
export function localizedCategoryName(slug: string, locale: string, fallback: string): string {
  const key = `catalog.category.${slug}`;
  const translated = createTranslator(locale).t(key);
  return translated === key ? fallback : translated;
}

/**
 * Katalog adını kullanıcının diline indirger.
 *
 * Sıra: veritabanı sözlüğünde tam dil eşleşmesi → slug'a bağlı statik çeviri →
 * sözlüğün yedek dilleri → Türkçe `name`.
 *
 * Statik harita ortada durur çünkü üst kategoriler altı dilde çevrilidir ama
 * veritabanı sözlüğü yalnızca tr/en taşır. Doğrudan sözlüğün yedeğine düşseydik
 * Almanca arayüzde mevcut Almanca ad varken İngilizcesi gösterilirdi.
 */
export function catalogName(value: LocalizedName & { slug?: string }, locale: string): string {
  const dictionary = value.nameTranslations;
  if (typeof dictionary === 'object' && dictionary !== null) {
    const exact = dictionary[locale];
    if (typeof exact === 'string' && exact.length > 0) return exact;
  }

  if (value.slug !== undefined) {
    const fromKeys = localizedCategoryName(value.slug, locale, '');
    if (fromKeys.length > 0) return fromKeys;
  }

  return resolveCategoryName(value, locale);
}
