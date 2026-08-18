import { LOCALE_META } from '@talpio/config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/components/providers';
import { ThemeScript } from '@/components/theme-script';
import { t } from '@/lib/i18n';
import { applyRequestLocale } from '@/lib/server-locale';

import './globals.css';

/** Locale çerezine göre SSR; statik EN önbelleğini engeller. */
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  await applyRequestLocale();
  return {
    title: {
      default: t('admin.panel'),
      template: '%s · Talpio',
    },
    description: t('admin.brandSubtitle'),
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const initialLocale = await applyRequestLocale();

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
