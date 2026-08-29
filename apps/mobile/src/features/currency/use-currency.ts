import { DEFAULT_CURRENCY, LOCALE_CURRENCY } from '@talpio/config';

import { useSession } from '@/features/auth/session-provider';
import { useI18n } from '@/lib/i18n';

/**
 * Kullanıcının fiyat gösterim para birimi.
 *
 * Sunucu `currency` alanını daima dolu döndürür; burada yalnızca oturum
 * açılmamışken bir karşılık üretilir. Oturumsuz kullanıcıya dilinin para birimi
 * gösterilir, sabit bir varsayılan değil.
 */
export function useMyCurrency(): string {
  const { user } = useSession();
  const { locale } = useI18n();
  return user?.currency ?? LOCALE_CURRENCY[locale] ?? DEFAULT_CURRENCY;
}
