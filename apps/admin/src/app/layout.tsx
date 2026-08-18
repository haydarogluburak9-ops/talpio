import { LOCALE_COOKIE, LOCALE_META } from '@talpio/config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';

import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/theme-script';
import { t } from '@/lib/i18n';
import { localeFromAcceptLanguage, resolveLocale } from '@/lib/locale';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: t('admin.panel'),
    template: '%s · Talpio',
  },
  description: t('admin.brandSubtitle'),
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const accept = (await headers()).get('accept-language');
  const initialLocale = resolveLocale(
    jar.get(LOCALE_COOKIE)?.value ?? localeFromAcceptLanguage(accept),
  );

  return (
    <html
      lang={initialLocale}
      dir={LOCALE_META[initialLocale].dir}
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeScript />
        <Providers initialLocale={initialLocale}>{children}</Providers>
      </body>
    </html>
  );
}
