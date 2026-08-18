import { createTranslator } from './translator';

/** Katalog slug'ı için çevrilmiş ad; anahtar yoksa veritabanı adını kullanır. */
export function localizedCategoryName(slug: string, locale: string, fallback: string): string {
  const key = `catalog.category.${slug}`;
  const translated = createTranslator(locale).t(key);
  return translated === key ? fallback : translated;
}
