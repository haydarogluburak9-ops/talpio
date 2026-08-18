import { computeFeedScore } from './feed-ranking';

describe('computeFeedScore (feed ranking v2)', () => {
  const now = new Date('2026-08-10T12:00:00.000Z');

  it('takip edilen DEAL, eski takip edilmeyen TEXT üstünde sıralanır', () => {
    const followedDeal = computeFeedScore({
      authorFollowed: true,
      type: 'DEAL',
      hasDealMetadata: true,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: new Date('2026-08-10T10:00:00.000Z'),
      now,
    });

    const oldPlain = computeFeedScore({
      authorFollowed: false,
      type: 'TEXT',
      hasDealMetadata: false,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
      now,
    });

    expect(followedDeal).toBeGreaterThan(oldPlain);
  });

  it('72 saat içinde bitecek fırsata +20 ekler', () => {
    const base = {
      authorFollowed: false,
      type: 'DEAL',
      hasDealMetadata: true,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: now,
      now,
    };

    const endingSoon = computeFeedScore({
      ...base,
      dealEndsAt: new Date('2026-08-11T12:00:00.000Z'),
    });
    const farAway = computeFeedScore({
      ...base,
      dealEndsAt: new Date('2026-09-01T12:00:00.000Z'),
    });

    expect(endingSoon - farAway).toBeCloseTo(20, 5);
  });

  it('beğenilen kategori ve benzer yazara ek skor verir', () => {
    const base = {
      authorFollowed: false,
      type: 'DEAL',
      hasDealMetadata: true,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: now,
      now,
    };
    const liked = computeFeedScore({ ...base, likedCategoryMatch: true });
    const similar = computeFeedScore({ ...base, similarAuthor: true });
    expect(liked - computeFeedScore(base)).toBeCloseTo(45, 5);
    expect(similar - computeFeedScore(base)).toBeCloseTo(35, 5);
  });

  it('kategori takip skoruna +60 ekler (SC5)', () => {
    const base = {
      authorFollowed: false,
      type: 'DEAL',
      hasDealMetadata: true,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: now,
      now,
    };
    const withCategory = computeFeedScore({ ...base, categoryFollowed: true });
    const without = computeFeedScore({ ...base, categoryFollowed: false });
    expect(withCategory - without).toBeCloseTo(60, 5);
  });

  it('v2: tekrar gösterim ve bitmiş stok skoru düşürür', () => {
    const base = {
      authorFollowed: true,
      type: 'DEAL',
      hasDealMetadata: true,
      likeCount: 2,
      commentCount: 0,
      saveCount: 1,
      createdAt: now,
      now,
    };
    const fresh = computeFeedScore(base);
    const seen = computeFeedScore({ ...base, alreadySeen: true });
    const empty = computeFeedScore({ ...base, stockExhausted: true });
    expect(fresh - seen).toBeCloseTo(25, 5);
    expect(fresh - empty).toBeCloseTo(40, 5);
  });

  it('v2: konum ve talep geçmişi skoru yükseltir', () => {
    const base = {
      authorFollowed: false,
      type: 'TEXT',
      hasDealMetadata: false,
      likeCount: 0,
      commentCount: 0,
      saveCount: 0,
      createdAt: now,
      now,
    };
    const boosted = computeFeedScore({
      ...base,
      locationMatch: true,
      requestCategoryMatch: true,
    });
    expect(boosted - computeFeedScore(base)).toBeCloseTo(80, 5);
  });
});
