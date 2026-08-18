/**
 * İstemciye sızabilecek değişkenler yalnızca `NEXT_PUBLIC_` önekiyle okunur.
 * Gizli anahtarlar bu dosyaya girmez; sunucu tarafı ihtiyaçları ayrı bir
 * modülde ve yalnızca sunucu bileşenlerinde okunur.
 */
function flagEnabled(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value === '1' || value.toLowerCase() === 'true';
}

export const publicEnv = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3002',
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? 'en',
  /**
   * Ücretsiz lansman: Premium upsell ve AI agent UI kapalı.
   * Canlıdan sonra `NEXT_PUBLIC_FEATURE_PREMIUM=true` / `NEXT_PUBLIC_FEATURE_AGENT=true`.
   */
  featurePremium: flagEnabled(process.env.NEXT_PUBLIC_FEATURE_PREMIUM, false),
  featureAgent: flagEnabled(process.env.NEXT_PUBLIC_FEATURE_AGENT, false),
  /** Escrow / ödeme geçmişi yüzeyi; varsayılan kapalı. */
  featurePayments: flagEnabled(process.env.NEXT_PUBLIC_FEATURE_PAYMENTS, false),
} as const;
