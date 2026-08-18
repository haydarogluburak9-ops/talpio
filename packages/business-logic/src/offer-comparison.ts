/**
 * Teklif karşılaştırma. Deterministik rozetler üretir; "en iyi teklif" demez.
 */

export const OfferComparisonBadge = {
  LOWEST_PRICE: 'LOWEST_PRICE',
  FASTEST_DELIVERY: 'FASTEST_DELIVERY',
  HIGHEST_RATED: 'HIGHEST_RATED',
  CLOSEST_SELLER: 'CLOSEST_SELLER',
  VERIFIED_BUSINESS: 'VERIFIED_BUSINESS',
  BEST_WARRANTY: 'BEST_WARRANTY',
  RESPONSE_QUALITY: 'RESPONSE_QUALITY',
} as const;

export type OfferComparisonBadge =
  (typeof OfferComparisonBadge)[keyof typeof OfferComparisonBadge];

export interface ComparableOffer {
  id: string;
  amountMinor: number;
  deliveryDays?: number | null;
  estimatedDurationMinutes?: number | null;
  averageRating?: number | null;
  verified?: boolean;
  distanceKm?: number | null;
  warrantyDays?: number | null;
  /** Daha uzun, dolu not = daha iyi yanıt kalitesi sinyali */
  noteLength?: number | null;
  responseMinutes?: number | null;
}

export interface OfferComparison {
  lowestPriceId: string | null;
  fastestDeliveryId: string | null;
  highestRatedId: string | null;
  closestSellerId: string | null;
  bestWarrantyId: string | null;
  responseQualityId: string | null;
  badgesByOfferId: Record<string, OfferComparisonBadge[]>;
}

function minIds<T>(
  items: readonly T[],
  valueOf: (item: T) => number | null | undefined,
): string[] {
  let best: number | null = null;
  const winners: string[] = [];
  for (const item of items) {
    const value = valueOf(item);
    if (value == null || !Number.isFinite(value)) continue;
    if (best == null || value < best) {
      best = value;
      winners.length = 0;
      winners.push((item as { id: string }).id);
    } else if (value === best) {
      winners.push((item as { id: string }).id);
    }
  }
  return winners;
}

function maxIds<T>(
  items: readonly T[],
  valueOf: (item: T) => number | null | undefined,
): string[] {
  return minIds(items, (item) => {
    const value = valueOf(item);
    return value == null ? null : -value;
  });
}

export function compareOffers(offers: readonly ComparableOffer[]): OfferComparison {
  const badgesByOfferId: Record<string, OfferComparisonBadge[]> = {};
  for (const offer of offers) {
    badgesByOfferId[offer.id] = [];
  }

  const add = (ids: readonly string[], badge: OfferComparisonBadge) => {
    for (const id of ids) {
      const list = badgesByOfferId[id];
      if (list && !list.includes(badge)) list.push(badge);
    }
  };

  const lowest = minIds(offers, (o) => o.amountMinor);
  add(lowest, OfferComparisonBadge.LOWEST_PRICE);

  const fastest = minIds(
    offers,
    (o) => o.deliveryDays ?? o.estimatedDurationMinutes ?? null,
  );
  add(fastest, OfferComparisonBadge.FASTEST_DELIVERY);

  const rated = maxIds(offers, (o) => o.averageRating ?? null);
  add(rated, OfferComparisonBadge.HIGHEST_RATED);

  const closest = minIds(offers, (o) => o.distanceKm ?? null);
  add(closest, OfferComparisonBadge.CLOSEST_SELLER);

  const warranty = maxIds(offers, (o) => o.warrantyDays ?? null);
  add(warranty, OfferComparisonBadge.BEST_WARRANTY);

  const hasResponseTime = offers.some((o) => o.responseMinutes != null);
  const quality = hasResponseTime
    ? minIds(offers, (o) => o.responseMinutes ?? null)
    : maxIds(offers, (o) => (o.noteLength != null && o.noteLength > 20 ? o.noteLength : null));
  add(quality, OfferComparisonBadge.RESPONSE_QUALITY);

  for (const offer of offers) {
    if (offer.verified) {
      add([offer.id], OfferComparisonBadge.VERIFIED_BUSINESS);
    }
  }

  return {
    lowestPriceId: lowest[0] ?? null,
    fastestDeliveryId: fastest[0] ?? null,
    highestRatedId: rated[0] ?? null,
    closestSellerId: closest[0] ?? null,
    bestWarrantyId: warranty[0] ?? null,
    responseQualityId: quality[0] ?? null,
    badgesByOfferId,
  };
}
