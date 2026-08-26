import { DEFAULT_LOCALE } from '@talpio/config';
import type { AttributeFieldOption, LocalizedText } from '@talpio/types';

/**
 * Çok dilli metni kullanıcının diline indirger.
 *
 * Yedekleme sırası: istenen dil → İngilizce (`DEFAULT_LOCALE`) → sözlükteki ilk
 * dolu değer. Düz string, tüm dillerde aynı metin demektir; veritabanındaki
 * eski satırlar bu biçimde durur.
 */
export function resolveLocalizedText(value: LocalizedText | undefined, locale: string): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;

  const requested = value[locale];
  if (typeof requested === 'string' && requested.length > 0) return requested;

  const fallback = value[DEFAULT_LOCALE];
  if (typeof fallback === 'string' && fallback.length > 0) return fallback;

  for (const candidate of Object.values(value)) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }

  return '';
}

/** Enum seçeneğinin görünen etiketi; boşsa saklanan değere düşer. */
export function resolveOptionLabel(option: AttributeFieldOption, locale: string): string {
  const label = resolveLocalizedText(option.label, locale);
  return label.length > 0 ? label : option.value;
}
