import { OfferComparisonBadge, compareOffers } from './offer-comparison';

describe('compareOffers', () => {
  it('en düşük fiyat ve en hızlı teslim rozetlerini ayrı tekliflere basar', () => {
    const result = compareOffers([
      {
        id: 'cheap',
        amountMinor: 10000,
        deliveryDays: 7,
        averageRating: 4.2,
        verified: false,
      },
      {
        id: 'fast',
        amountMinor: 18000,
        deliveryDays: 2,
        averageRating: 4.9,
        verified: true,
      },
    ]);

    expect(result.badgesByOfferId.cheap).toContain(OfferComparisonBadge.LOWEST_PRICE);
    expect(result.badgesByOfferId.fast).toContain(OfferComparisonBadge.FASTEST_DELIVERY);
    expect(result.badgesByOfferId.fast).toContain(OfferComparisonBadge.HIGHEST_RATED);
    expect(result.badgesByOfferId.fast).toContain(OfferComparisonBadge.VERIFIED_BUSINESS);
    expect(result.badgesByOfferId.cheap).not.toContain(OfferComparisonBadge.VERIFIED_BUSINESS);
  });

  it('eşit fiyatta her iki teklife de düşük fiyat rozeti verir', () => {
    const result = compareOffers([
      { id: 'a', amountMinor: 5000 },
      { id: 'b', amountMinor: 5000 },
    ]);
    expect(result.badgesByOfferId.a).toContain(OfferComparisonBadge.LOWEST_PRICE);
    expect(result.badgesByOfferId.b).toContain(OfferComparisonBadge.LOWEST_PRICE);
  });

  it('EN İYİ TEKLİF benzeri tek kazanan rozeti üretmez', () => {
    const result = compareOffers([
      { id: 'a', amountMinor: 1000, deliveryDays: 1, averageRating: 5, verified: true },
    ]);
    const badges = result.badgesByOfferId.a ?? [];
    expect(badges.join(' ')).not.toMatch(/BEST_OFFER|EN_IYI/i);
  });
});
