import { DEFAULT_LOCALE } from '@ustapilot/config';
import type { NotificationParams, NotificationType } from '@ustapilot/types';

import { formatDateTime, formatMoneyMinor, formatRating } from './format';
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
 */
function withLocalizedValues(params: NotificationParams, locale: string): NotificationParams {
  const values: NotificationParams = { ...params };

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
