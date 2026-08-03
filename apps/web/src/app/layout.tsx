import { THEME_INIT_SCRIPT } from '@ustapilot/ui';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { Providers } from '@/components/providers';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
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
    locale: 'tr_TR',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Erişilebilirlik için kullanıcı yakınlaştırması engellenmez.
  maximumScale: 5,
  // Tarayıcı çubuğu tema arka planıyla aynı kalmalı; theme.css ile eşleşir.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fa' },
    { media: '(prefers-color-scheme: dark)', color: '#02101d' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={publicEnv.defaultLocale} className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>
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
