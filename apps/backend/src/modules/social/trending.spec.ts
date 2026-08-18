import { TRENDING_MIN_UNIQUE, computeTrendingScore } from './trending';

describe('computeTrendingScore', () => {
  it('eşik altındaki unique etkileşimi sıfırlar', () => {
    expect(
      computeTrendingScore({
        uniqueInteractions: TRENDING_MIN_UNIQUE - 1,
        likeCount: 100,
        commentCount: 50,
        saveCount: 20,
        shareCount: 10,
        repostCount: 5,
        requestConversions: 2,
        freshnessHours: 2,
      }),
    ).toBe(0);
  });

  it('yazar spam bayrağında sıfır döner', () => {
    expect(
      computeTrendingScore({
        uniqueInteractions: 20,
        likeCount: 10,
        commentCount: 10,
        saveCount: 10,
        shareCount: 0,
        repostCount: 0,
        requestConversions: 0,
        freshnessHours: 1,
        authorSpam: true,
      }),
    ).toBe(0);
  });

  it('yüksek unique + velocity daha yüksek skor üretir', () => {
    const base = {
      likeCount: 10,
      commentCount: 4,
      saveCount: 6,
      shareCount: 2,
      repostCount: 1,
      requestConversions: 0,
      freshnessHours: 4,
    };
    const hot = computeTrendingScore({ ...base, uniqueInteractions: 30 });
    const mild = computeTrendingScore({ ...base, uniqueInteractions: 5 });
    expect(hot).toBeGreaterThan(mild);
  });
});
