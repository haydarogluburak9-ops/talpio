import { DEFAULT_LOCALE } from '@talpio/config';
import type { NotificationParams, NotificationType } from '@talpio/types';

import { formatDateTime, formatMoneyMinor, formatRating } from './format';
import { resolveLocalizedText } from './localized-text';
import { createTranslator } from './translator';

export interface RenderedNotification {
  title: string;
  body: string;
}

/**
 * Bildirim metnini çözer.
 *
 * Sunucu hazır cümle saklamadığı için başlık ve gövde her istemcide burada
 * üretilir. Web, mobil ve panel aynı fonksiyonu çağırır; metin bir yerde
 * değişince üçü birlikte değişir.
 */
export function renderNotification(
  type: NotificationType,
  params: NotificationParams,
  locale: string = DEFAULT_LOCALE,
): RenderedNotification {
  const { t } = createTranslator(locale);
  const values = withLocalizedValues(params, locale);

  return {
    title: t(`notification.${type}.title`, values),
    body: t(`notification.${type}.body`, values),
  };
}

/**
 * Para, puan ve tarih alanlarının biçimi dile bağlıdır; yerleştirmeden önce
 * çevrilir. Aksi halde katalog metni "180000" gibi ham değer taşırdı.
 *
 * Sözlük taşıyan parametreler (kategori adı gibi) de burada dile indirgenir;
 * gövdenin geri kalanı alıcının dilindeyken içine Türkçe ada gömülmesin.
 */
function withLocalizedValues(
  params: NotificationParams,
  locale: string,
): Record<string, string | number> {
  const values: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(params)) {
    values[key] = typeof value === 'object' ? resolveLocalizedText(value, locale) : value;
  }

  if (typeof params.amountMinor === 'number') {
    values.amount = formatMoneyMinor(
      params.amountMinor,
      typeof params.currency === 'string' ? params.currency : undefined,
      locale,
    );
  }

  if (typeof params.rating === 'number') {
    values.rating = formatRating(params.rating, locale);
  }

  if (typeof params.scheduledAt === 'string') {
    values.scheduledAt = formatDateTime(params.scheduledAt, locale);
  }

  return values;
}
