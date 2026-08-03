import { OfferSortKey, rankProviders, scoreProvider, sortOffers } from './provider-ranking';
import type { RankableProvider } from './provider-ranking';

const now = new Date('2026-03-01T12:00:00.000Z');

function makeProvider(overrides: Partial<RankableProvider> = {}): RankableProvider {
  return {
    providerProfileId: 'provider-1',
    averageRating: 4.5,
    reviewCount: 40,
    completedJobCount: 50,
    averageResponseMinutes: 30,
    cancellationRate: 0.02,
    isVerified: true,
    isPremium: false,
    lastActiveAt: '2026-03-01T09:00:00.000Z',
    ...overrides,
  };
}

describe('scoreProvider', () => {
  it('skoru 0 ile 1 arasında üretir', () => {
    const score = scoreProvider(makeProvider(), { now });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('doğrulanmamış usta doğrulanmışın gerisinde kalır', () => {
    const verified = scoreProvider(makeProvider({ isVerified: true }), { now });
    const unverified = scoreProvider(makeProvider({ isVerified: false }), { now });
    expect(unverified).toBeLessThan(verified);
  });

  it('tek yorumlu mükemmel puan, çok yorumlu yüksek puanı geçemez', () => {
    const newcomer = scoreProvider(
      makeProvider({ averageRating: 5, reviewCount: 1, completedJobCount: 1 }),
      { now },
    );
    const established = scoreProvider(
      makeProvider({ averageRating: 4.8, reviewCount: 200, completedJobCount: 200 }),
      { now },
    );
    expect(newcomer).toBeLessThan(established);
  });

  it('yüksek iptal oranı skoru düşürür', () => {
    const reliable = scoreProvider(makeProvider({ cancellationRate: 0 }), { now });
    const unreliable = scoreProvider(makeProvider({ cancellationRate: 0.5 }), { now });
    expect(unreliable).toBeLessThan(reliable);
  });

  it('uzun süredir aktif olmayan usta geriler', () => {
    const active = scoreProvider(makeProvider({ lastActiveAt: '2026-03-01T09:00:00.000Z' }), {
      now,
    });
    const inactive = scoreProvider(makeProvider({ lastActiveAt: '2025-11-01T09:00:00.000Z' }), {
      now,
    });
    expect(inactive).toBeLessThan(active);
  });
});

describe('rankProviders', () => {
  it('en yüksek skorluyu başa alır', () => {
    const weak = makeProvider({ providerProfileId: 'weak', averageRating: 3, reviewCount: 5 });
    const strong = makeProvider({
      providerProfileId: 'strong',
      averageRating: 4.9,
      reviewCount: 150,
      completedJobCount: 180,
    });

    const ranked = rankProviders([weak, strong], { now });
    expect(ranked[0]?.providerProfileId).toBe('strong');
  });

  it('girdi dizisini değiştirmez', () => {
    const providers = [makeProvider({ providerProfileId: 'a' }), makeProvider({ providerProfileId: 'b' })];
    const copy = [...providers];
    rankProviders(providers, { now });
    expect(providers).toEqual(copy);
  });
});

describe('sortOffers', () => {
  const cheap = {
    id: 'cheap',
    amountMinor: 50_000,
    estimatedDurationMinutes: 240,
    createdAt: '2026-02-28T10:00:00.000Z',
    provider: makeProvider({ providerProfileId: 'p-cheap', averageRating: 3.2, reviewCount: 4 }),
  };
  const premium = {
    id: 'premium',
    amountMinor: 90_000,
    estimatedDurationMinutes: 120,
    createdAt: '2026-03-01T10:00:00.000Z',
    provider: makeProvider({
      providerProfileId: 'p-premium',
      averageRating: 4.9,
      reviewCount: 180,
      completedJobCount: 220,
    }),
  };

  it('fiyata göre artan sıralar', () => {
    expect(sortOffers([premium, cheap], OfferSortKey.PRICE_ASC).map((o) => o.id)).toEqual([
      'cheap',
      'premium',
    ]);
  });

  it('en hızlıyı öne alır', () => {
    expect(sortOffers([cheap, premium], OfferSortKey.FASTEST).map((o) => o.id)).toEqual([
      'premium',
      'cheap',
    ]);
  });

  it('önerilen sıralamada güçlü usta öne çıkar', () => {
    expect(sortOffers([cheap, premium], OfferSortKey.RECOMMENDED, { now })[0]?.id).toBe(
      'premium',
    );
  });

  it('en yeniyi öne alır', () => {
    expect(sortOffers([cheap, premium], OfferSortKey.NEWEST).map((o) => o.id)).toEqual([
      'premium',
      'cheap',
    ]);
  });
});
