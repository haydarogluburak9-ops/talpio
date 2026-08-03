/**
 * İstemciye sızabilecek değişkenler yalnızca `NEXT_PUBLIC_` önekiyle okunur.
 * Gizli anahtarlar bu dosyaya girmez; sunucu tarafı ihtiyaçları ayrı bir
 * modülde ve yalnızca sunucu bileşenlerinde okunur.
 */
export const publicEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002',
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'tr',
} as const;
