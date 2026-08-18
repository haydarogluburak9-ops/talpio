import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  poweredByHeader: false,
  // Kaynak olarak yayımlanan monorepo paketleri Next tarafından derlenir.
  transpilePackages: ['@talpio/ui', '@talpio/localization'],
  async redirects() {
    return [
      { source: '/usta-ol', destination: '/kayit', permanent: true },
      { source: '/satici-ol', destination: '/kayit', permanent: false },
      { source: '/usta/panel', destination: '/satici/panel', permanent: true },
      { source: '/usta/tedarik', destination: '/satici/tedarik', permanent: true },
      { source: '/ustalar/:id', destination: '/saticilar/:id', permanent: true },
      { source: '/feed', destination: '/akis', permanent: false },
      { source: '/discover', destination: '/kesfet', permanent: false },
      { source: '/messages', destination: '/mesajlar', permanent: false },
      { source: '/requests', destination: '/taleplerim', permanent: false },
      { source: '/orders', destination: '/siparislerim', permanent: false },
      { source: '/support', destination: '/destek', permanent: false },
      { source: '/seller', destination: '/satici/panel', permanent: false },
      { source: '/supply', destination: '/tedarik', permanent: false },
      { source: '/forgot-password', destination: '/sifremi-unuttum', permanent: false },
      { source: '/reset-password', destination: '/sifre-sifirla', permanent: false },
      { source: '/verify-email', destination: '/dogrula-eposta', permanent: false },
      { source: '/privacy', destination: '/yasal/gizlilik', permanent: false },
      { source: '/terms', destination: '/yasal/kullanim-kosullari', permanent: false },
      { source: '/gdpr', destination: '/yasal/kvkk', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

export default nextConfig;
