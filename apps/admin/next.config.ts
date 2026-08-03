import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Docker imajında yalnızca gerekli dosyaların bulunması için.
  output: 'standalone',
  // Monorepo kökünden izleme yapılabilmesi için çıktı kökü açıkça belirtilir.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  poweredByHeader: false,
  // Kaynak olarak yayımlanan monorepo paketleri Next tarafından derlenir.
  transpilePackages: ['@ustapilot/ui'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
