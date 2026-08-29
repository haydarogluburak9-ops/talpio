import type { MetadataRoute } from 'next';

import { publicEnv } from '@/lib/env';

/**
 * Herkese açık, oturum gerektirmeyen sayfalar.
 *
 * Profil ve kategori gibi dinamik sayfalar bilerek dışarıda: haritayı derleme
 * anında üretmek API'ye bağımlılık yaratır ve API ayakta değilken imaj derlemesi
 * kırılır. Bu sayfalara zaten iç bağlantılardan ulaşılıyor.
 */
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] =
  [
    { path: '', priority: 1, changeFrequency: 'daily' },
    { path: '/nasil-calisir', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/kategoriler', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/kesfet', priority: 0.7, changeFrequency: 'daily' },
    { path: '/kayit', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/satici-ol', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/yasal/kullanim-kosullari', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/yasal/gizlilik', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/yasal/kvkk', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/yasal/mesafeli-satis', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/yasal/cerez-politikasi', priority: 0.3, changeFrequency: 'yearly' },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.map((route) => ({
    url: `${publicEnv.siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
