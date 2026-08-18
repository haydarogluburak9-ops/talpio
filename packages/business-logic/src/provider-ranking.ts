export interface RankableProvider {
  providerProfileId: string;
  averageRating?: number | null;
  reviewCount: number;
  completedJobCount: number;
  averageResponseMinutes?: number | null;
  cancellationRate: number;
  isVerified: boolean;
  isPremium: boolean;
  lastActiveAt?: string | Date | null;
}

export interface ProviderScoreWeights {
  rating: number;
  experience: number;
  responsiveness: number;
  reliability: number;
  recency: number;
  premium: number;
}

export const DEFAULT_PROVIDER_SCORE_WEIGHTS: ProviderScoreWeights = {
  rating: 0.35,
  experience: 0.2,
  responsiveness: 0.15,
  reliability: 0.15,
  recency: 0.1,
  premium: 0.05,
};

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

/**
 * Puanı yorum sayısına göre yumuşatır (Bayesian ortalama). Tek bir 5 yıldızlı
 * yorumu olan satıcı, 200 yorumla 4,8 tutturan satıcının önüne geçmemelidir.
 */
function smoothedRating(rating: number | null | undefined, reviewCount: number): number {
  const priorWeight = 10;
  const priorMean = 3.8;
  if (rating == null || reviewCount <= 0) return priorMean / 5;
  const smoothed = (rating * reviewCount + priorMean * priorWeight) / (reviewCount + priorWeight);
  return clamp01(smoothed / 5);
}

function experienceScore(completedJobCount: number): number {
  // Azalan getiri: ilk işler skoru hızla, sonrakiler yavaş yükseltir.
  return clamp01(Math.log10(completedJobCount + 1) / Math.log10(201));
}

function responsivenessScore(averageResponseMinutes: number | null | undefined): number {
  if (averageResponseMinutes == null) return 0.5;
  const oneDay = 60 * 24;
  return clamp01(1 - Math.min(averageResponseMinutes, oneDay) / oneDay);
}

function recencyScore(lastActiveAt: string | Date | null | undefined, now: Date): number {
  if (!lastActiveAt) return 0;
  const last = lastActiveAt instanceof Date ? lastActiveAt : new Date(lastActiveAt);
  const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(days)) return 0;
  return clamp01(1 - Math.min(days, 30) / 30);
}

/** 0 ile 1 arasında bir sıralama skoru üretir. */
export function scoreProvider(
  provider: RankableProvider,
  options: { weights?: Partial<ProviderScoreWeights>; now?: Date } = {},
): number {
  const weights = { ...DEFAULT_PROVIDER_SCORE_WEIGHTS, ...options.weights };
  const now = options.now ?? new Date();

  const score =
    weights.rating * smoothedRating(provider.averageRating, provider.reviewCount) +
    weights.experience * experienceScore(provider.completedJobCount) +
    weights.responsiveness * responsivenessScore(provider.averageResponseMinutes) +
    weights.reliability * clamp01(1 - provider.cancellationRate) +
    weights.recency * recencyScore(provider.lastActiveAt, now) +
    weights.premium * (provider.isPremium ? 1 : 0);

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const normalized = totalWeight > 0 ? score / totalWeight : 0;

  // Doğrulanmamış satıcı hiçbir koşulda doğrulanmışın önüne geçmemelidir.
  return provider.isVerified ? clamp01(normalized) : clamp01(normalized) * 0.5;
}

export function rankProviders<T extends RankableProvider>(
  providers: readonly T[],
  options: { weights?: Partial<ProviderScoreWeights>; now?: Date } = {},
): T[] {
  return [...providers].sort((a, b) => scoreProvider(b, options) - scoreProvider(a, options));
}

export const OfferSortKey = {
  RECOMMENDED: 'RECOMMENDED',
  PRICE_ASC: 'PRICE_ASC',
  PRICE_DESC: 'PRICE_DESC',
  RATING_DESC: 'RATING_DESC',
  FASTEST: 'FASTEST',
  NEWEST: 'NEWEST',
} as const;

export type OfferSortKey = (typeof OfferSortKey)[keyof typeof OfferSortKey];

export interface SortableOffer {
  id: string;
  amountMinor: number;
  estimatedDurationMinutes?: number | null;
  createdAt: string | Date;
  provider: RankableProvider;
}

/** Teklif karşılaştırma ekranındaki sıralama. Web ve mobil aynı sırayı gösterir. */
export function sortOffers<T extends SortableOffer>(
  offers: readonly T[],
  sortKey: OfferSortKey = OfferSortKey.RECOMMENDED,
  options: { now?: Date } = {},
): T[] {
  const now = options.now ?? new Date();
  const items = [...offers];

  switch (sortKey) {
    case OfferSortKey.PRICE_ASC:
      return items.sort((a, b) => a.amountMinor - b.amountMinor);
    case OfferSortKey.PRICE_DESC:
      return items.sort((a, b) => b.amountMinor - a.amountMinor);
    case OfferSortKey.RATING_DESC:
      return items.sort(
        (a, b) => (b.provider.averageRating ?? 0) - (a.provider.averageRating ?? 0),
      );
    case OfferSortKey.FASTEST:
      return items.sort(
        (a, b) =>
          (a.estimatedDurationMinutes ?? Number.MAX_SAFE_INTEGER) -
          (b.estimatedDurationMinutes ?? Number.MAX_SAFE_INTEGER),
      );
    case OfferSortKey.NEWEST:
      return items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case OfferSortKey.RECOMMENDED:
    default:
      return items.sort((a, b) => {
        const scoreDiff =
          scoreProvider(b.provider, { now }) - scoreProvider(a.provider, { now });
        if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
        return a.amountMinor - b.amountMinor;
      });
  }
}
