import 'server-only';

import { LOCALE_COOKIE, type SupportedLocale } from '@talpio/config';
import { cookies, headers } from 'next/headers';

import { hydrateLocale } from '@/lib/i18n';
import { localeFromAcceptLanguage, resolveLocale } from '@/lib/locale';

export async function getRequestLocale(): Promise<SupportedLocale> {
  const jar = await cookies();
  const accept = (await headers()).get('accept-language');
  return resolveLocale(jar.get(LOCALE_COOKIE)?.value ?? localeFromAcceptLanguage(accept));
}

/** Sunucu bileşenlerinde `t()` doğru dili kullansın diye istek başına locale uygular. */
export async function applyRequestLocale(): Promise<SupportedLocale> {
  const locale = await getRequestLocale();
  hydrateLocale(locale);
  return locale;
}
