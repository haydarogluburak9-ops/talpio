import { LOCALE_COOKIE, LOCALE_META } from '@talpio/config';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/theme-script';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';
import { localeFromAcceptLanguage, resolveLocale } from '@/lib/locale';

import './globals.css';

const inter = Inter({
  variable: '--font-sans-body',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${t('common.appName')} — ${t('common.tagline')}`,
    template: `%s · ${t('common.appName')}`,
  },
  description: t('home.heroSubtitle'),
  openGraph: {
    type: 'website',
    siteName: t('common.appName'),
    locale: 'en_US',
    alternateLocale: ['tr_TR', 'de_DE', 'es_ES', 'fr_FR', 'ar'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fa' },
    { media: '(prefers-color-scheme: dark)', color: '#07111f' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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
      <body className="flex min-h-full flex-col">
        <ThemeScript />
        <Providers initialLocale={initialLocale}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[--radius-control] focus:bg-surface focus:px-4 focus:py-2"
          >
            {t('common.skipToContent')}
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
