import { LOCALE_META } from '@talpio/config';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/theme-script';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';
import { applyRequestLocale } from '@/lib/server-locale';

import './globals.css';

const inter = Inter({
  variable: '--font-sans-body',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await applyRequestLocale();
  const ogLocale = LOCALE_META[locale].tag.replace('-', '_');

  return {
    metadataBase: new URL(publicEnv.siteUrl),
    title: {
      default: `${t('common.appName')} — ${t('common.tagline')}`,
      template: `%s · ${t('common.appName')}`,
    },
    description: t('home.heroSubtitle'),
    openGraph: {
      type: 'website',
      siteName: t('common.appName'),
      locale: ogLocale,
      alternateLocale: SUPPORTED_OG_LOCALES.filter((item) => item !== ogLocale),
    },
  };
}

const SUPPORTED_OG_LOCALES = ['en_US', 'tr_TR', 'de_DE', 'es_ES', 'fr_FR', 'ar'] as const;

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
  const initialLocale = await applyRequestLocale();

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
