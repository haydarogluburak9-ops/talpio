'use client';

import { DEFAULT_CURRENCY, LOCALE_CURRENCY } from '@talpio/config';

import { useSession } from '@/features/auth/use-session';
import { getLocale } from '@/lib/i18n';

/**
 * Kullanıcının fiyat gösterim para birimi.
 *
 * Sunucu `currency` alanını daima dolu döndürür; burada yalnızca oturum henüz
 * yüklenmemişken veya ziyaretçi için bir karşılık üretilir. Ziyaretçiye dilinin
 * para birimi gösterilir: dolar dayatmak, Almanca sayfayı gezen birine yabancı
 * bir fiyat etiketi göstermek olurdu.
 */
export function useMyCurrency(): string {
  const session = useSession();
  return session.data?.currency ?? LOCALE_CURRENCY[getLocale()] ?? DEFAULT_CURRENCY;
}
