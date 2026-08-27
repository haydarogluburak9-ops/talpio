import type { MetadataRoute } from 'next';

import { publicEnv } from '@/lib/env';

/**
 * Oturum gerektiren alanlar zaten sayfa bazında `noindex` taşıyor. Burada
 * taranmalarını da engelliyoruz: bot bütçesi vitrin sayfalarına gitsin ve özel
 * içerik hiç istenmesin.
 *
 * Ön ek eşleşmesine dikkat: `/satici` yazılırsa herkese açık `/satici-ol` da
 * kapanır. Dizin kastedilen yerlerde sonuna eğik çizgi konur.
 */
const DISALLOW = [
  '/bildirimler',
  '/destek',
  '/dogrula-eposta',
  '/hesabim',
  '/mesajlar',
  '/odemeler',
  '/profil',
  '/satici/',
  '/sifre-sifirla',
  '/sifremi-unuttum',
  '/siparislerim',
  '/talep-olustur',
  '/taleplerim',
  '/tedarik/',
  '/tedariklerim',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: DISALLOW }],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
