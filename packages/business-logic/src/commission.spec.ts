import { CommissionType } from '@ustapilot/types';
import type { CommissionRule } from '@ustapilot/types';

import { bpsToPercent, calculateCommission, percentToBps, selectCommissionRule } from './commission';

function makeRule(overrides: Partial<CommissionRule> = {}): CommissionRule {
  return {
    id: 'rule-default',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    name: 'Varsayılan',
    type: CommissionType.PERCENTAGE,
    rateBps: 1250,
    fixedMinor: 0,
    categoryId: null,
    cityId: null,
    premiumRateBps: null,
    minAmountMinor: null,
    maxAmountMinor: null,
    priority: 0,
    isActive: true,
    validFrom: null,
    validUntil: null,
    ...overrides,
  };
}

describe('calculateCommission', () => {
  it('yüzdelik komisyonu kuruş bazında hesaplar', () => {
    const result = calculateCommission(
      { grossMinor: 100_000, currency: 'TRY' },
      makeRule({ rateBps: 1250 }),
    );

    expect(result.commissionMinor).toBe(12_500);
    expect(result.netPayoutMinor).toBe(87_500);
  });

  it('net tutar daima brüt eksi komisyona eşittir', () => {
    const result = calculateCommission(
      { grossMinor: 33_333, currency: 'TRY' },
      makeRule({ rateBps: 1250 }),
    );

    expect(result.commissionMinor + result.netPayoutMinor).toBe(33_333);
  });

  it('sabit komisyonda oran uygulanmaz', () => {
    const result = calculateCommission(
      { grossMinor: 100_000, currency: 'TRY' },
      makeRule({ type: CommissionType.FIXED, fixedMinor: 5_000, rateBps: 1250 }),
    );

    expect(result.commissionMinor).toBe(5_000);
    expect(result.appliedRateBps).toBe(0);
  });

  it('karma komisyonda oran ve sabit bedel toplanır', () => {
    const result = calculateCommission(
      { grossMinor: 100_000, currency: 'TRY' },
      makeRule({ type: CommissionType.HYBRID, rateBps: 1000, fixedMinor: 2_500 }),
    );

    expect(result.commissionMinor).toBe(12_500);
  });

  it('premium ustaya indirimli oran uygular', () => {
    const result = calculateCommission(
      { grossMinor: 100_000, currency: 'TRY', isPremiumProvider: true },
      makeRule({ rateBps: 1250, premiumRateBps: 1000 }),
    );

    expect(result.commissionMinor).toBe(10_000);
  });

  it('komisyon brüt tutarı aşamaz', () => {
    const result = calculateCommission(
      { grossMinor: 1_000, currency: 'TRY' },
      makeRule({ type: CommissionType.FIXED, fixedMinor: 50_000 }),
    );

    expect(result.commissionMinor).toBe(1_000);
    expect(result.netPayoutMinor).toBe(0);
  });

  it('kural yoksa varsayılan orana düşer', () => {
    const result = calculateCommission({ grossMinor: 100_000, currency: 'TRY' }, null);

    expect(result.appliedRateBps).toBe(1250);
    expect(result.appliedRuleId).toBeNull();
  });

  it('kuruş olmayan tutarı reddeder', () => {
    expect(() => calculateCommission({ grossMinor: 100.5, currency: 'TRY' })).toThrow(RangeError);
  });
});

describe('selectCommissionRule', () => {
  const at = new Date('2026-03-01T00:00:00.000Z');

  it('kategoriye özel kuralı genel kurala tercih eder', () => {
    const general = makeRule({ id: 'general', priority: 10 });
    const specific = makeRule({ id: 'specific', categoryId: 'cat-1', priority: 0 });

    const selected = selectCommissionRule([general, specific], {
      grossMinor: 100_000,
      currency: 'TRY',
      categoryId: 'cat-1',
      at,
    });

    expect(selected?.id).toBe('specific');
  });

  it('süresi geçmiş kuralı elemede kullanmaz', () => {
    const expired = makeRule({ id: 'expired', validUntil: '2026-02-01T00:00:00.000Z' });

    const selected = selectCommissionRule([expired], {
      grossMinor: 100_000,
      currency: 'TRY',
      at,
    });

    expect(selected).toBeNull();
  });

  it('tutar aralığı dışındaki kuralı seçmez', () => {
    const rule = makeRule({ id: 'high-only', minAmountMinor: 500_000 });

    const selected = selectCommissionRule([rule], {
      grossMinor: 100_000,
      currency: 'TRY',
      at,
    });

    expect(selected).toBeNull();
  });

  it('aynı özgüllükte yüksek öncelikli kuralı seçer', () => {
    const low = makeRule({ id: 'low', priority: 1 });
    const high = makeRule({ id: 'high', priority: 5 });

    const selected = selectCommissionRule([low, high], {
      grossMinor: 100_000,
      currency: 'TRY',
      at,
    });

    expect(selected?.id).toBe('high');
  });
});

describe('baz puan dönüşümleri', () => {
  it('baz puanı yüzdeye çevirir', () => {
    expect(bpsToPercent(1250)).toBe(12.5);
  });

  it('yüzdeyi baz puana çevirir', () => {
    expect(percentToBps(12.5)).toBe(1250);
  });
});
