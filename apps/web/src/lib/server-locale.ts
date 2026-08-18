import 'server-only';

import { LOCALE_COOKIE, type SupportedLocale } from '@talpio/config';
import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { hydrateLocale, t } from '@/lib/i18n';
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

type PageMetadataOptions = {
  descriptionKey?: string;
  robots?: Metadata['robots'];
};

/** Sayfa metadata'sı — locale uygulandıktan sonra `t()` ile üretir. */
export async function generatePageMetadata(
  titleKey: string,
  options?: PageMetadataOptions,
): Promise<Metadata> {
  await applyRequestLocale();
  return {
    title: t(titleKey),
    ...(options?.descriptionKey ? { description: t(options.descriptionKey) } : {}),
    ...(options?.robots !== undefined ? { robots: options.robots } : {}),
  };
}
