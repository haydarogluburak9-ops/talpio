import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from '@/components/providers';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'UstaPilot Yönetim Paneli',
    template: '%s · UstaPilot',
  },
  description: 'UstaPilot hizmet pazaryeri yönetim paneli',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
