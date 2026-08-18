import { computeTrustScore, TRUST_SCORE_WEIGHTS } from './trust-score';

const empty: Parameters<typeof computeTrustScore>[0] = {
  identityVerified: false,
  businessVerified: false,
  taxVerified: false,
  approvedDocumentCount: 0,
  successfulOrderCount: 0,
  reviewScore: null,
  reviewCount: 0,
  complaintCount: 0,
  refundCount: 0,
  paymentCount: 0,
  responseRatePercent: null,
  accountAgeDays: 0,
  cancelledOrderCount: 0,
  contentReportCount: 0,
};

describe('computeTrustScore', () => {
  it('yeni ve doğrulanmamış işletmede düşük skor üretir; sahte % basmaz', () => {
    const result = computeTrustScore(empty);
    expect(result.score).toBeLessThan(20);
    expect(result.breakdown.find((b) => b.code === 'reviews')?.points).toBe(0);
    expect(result.breakdown.find((b) => b.code === 'response')?.points).toBe(0);
  });

  it('doğrulama ve işlem sinyalleri skoru yükseltir', () => {
    const result = computeTrustScore({
      ...empty,
      identityVerified: true,
      businessVerified: true,
      taxVerified: true,
      approvedDocumentCount: 2,
      successfulOrderCount: 20,
      reviewScore: 5,
      reviewCount: 10,
      paymentCount: 20,
      responseRatePercent: 100,
      accountAgeDays: 730,
    });

    expect(result.score).toBe(100);
  });

  it('premium benzeri bir alan kabul etmez — fonksiyon imzasında yoktur', () => {
    expect('isPremium' in empty).toBe(false);
    const keys = Object.keys(empty);
    expect(keys.some((k) => k.toLowerCase().includes('premium'))).toBe(false);
    expect(keys.some((k) => k.toLowerCase().includes('subscription'))).toBe(false);
  });

  it('şikâyet oranı skoru düşürür', () => {
    const clean = computeTrustScore({
      ...empty,
      successfulOrderCount: 10,
      complaintCount: 0,
    });
    const noisy = computeTrustScore({
      ...empty,
      successfulOrderCount: 10,
      complaintCount: 10,
    });
    expect(noisy.breakdown.find((b) => b.code === 'complaints')!.points).toBeLessThan(
      clean.breakdown.find((b) => b.code === 'complaints')!.points,
    );
  });

  it('ağırlıklar 100 puan toplar', () => {
    const total = Object.values(TRUST_SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});
