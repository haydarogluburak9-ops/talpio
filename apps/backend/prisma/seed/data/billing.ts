/**
 * AI faturalama seed verisi.
 * Rakamlar `packages/config` MONETIZATION ve `DEFAULT_CREDIT_COSTS` ile uyumlu tutulur.
 */
export const SUBSCRIPTION_PLAN_SEEDS = [
  { code: 'FREE' as const, name: 'Ücretsiz', monthlyCredits: 50, sortOrder: 0 },
  { code: 'PREMIUM' as const, name: 'Premium', monthlyCredits: 500, sortOrder: 1 },
  { code: 'PREMIUM_PLUS' as const, name: 'Premium Plus', monthlyCredits: 2000, sortOrder: 2 },
  { code: 'BUSINESS' as const, name: 'Business', monthlyCredits: 5000, sortOrder: 3 },
];

export const AI_FEATURE_SEEDS = [
  {
    code: 'AGENT_CHAT' as const,
    name: 'Agent sohbet',
    baseCostCredits: 2,
    description: 'İş asistanı mesajı',
  },
  {
    code: 'REQUEST_DRAFT' as const,
    name: 'Talep taslağı',
    baseCostCredits: 5,
    description: 'AI ile talep metni',
  },
  {
    code: 'OFFER_DRAFT' as const,
    name: 'Teklif taslağı',
    baseCostCredits: 5,
    description: 'AI ile teklif metni',
  },
  {
    code: 'IMAGE_ANALYSIS' as const,
    name: 'Görsel analiz',
    baseCostCredits: 8,
    description: 'Görüntü analizi',
  },
  {
    code: 'AUDIO_TRANSCRIBE' as const,
    name: 'Ses deşifre',
    baseCostCredits: 10,
    description: 'Ses → metin',
  },
  {
    code: 'DOC_ANALYSIS' as const,
    name: 'Belge analizi',
    baseCostCredits: 12,
    description: 'Doküman analizi',
  },
  {
    code: 'GENERIC_COMPLETE' as const,
    name: 'Genel tamamla',
    baseCostCredits: 3,
    description: 'Genel AI tamamlaması',
  },
  {
    code: 'SOCIAL_DRAFT' as const,
    name: 'Sosyal taslak',
    baseCostCredits: 5,
    description: 'AI ile gönderi / kampanya metni',
  },
  {
    code: 'SALES_COACH' as const,
    name: 'Satış koçu',
    baseCostCredits: 4,
    description: 'Analitik açıklaması (sayı üretmez)',
  },
];

/** FREE: yalnızca deneme özellikleri; PREMIUM+ tüm özellikler. */
export const FREE_PLAN_FEATURES = ['AGENT_CHAT', 'GENERIC_COMPLETE'] as const;

export const ALL_AI_FEATURES = AI_FEATURE_SEEDS.map((f) => f.code);