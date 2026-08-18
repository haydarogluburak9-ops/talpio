import { ratioPercent, toFiniteNumber } from './business-profile.stats';

describe('business-profile.stats', () => {
  it('payda sıfırken oran döndürmez', () => {
    expect(ratioPercent(0, 0)).toBeNull();
    expect(ratioPercent(3, 0)).toBeNull();
  });

  it('yanıt ve kabul oranını yüzdeye yuvarlar', () => {
    expect(ratioPercent(3, 4)).toBe(75);
    expect(ratioPercent(1, 3)).toBe(33);
    expect(ratioPercent(12, 10)).toBe(100);
  });

  it('Decimal benzeri değerleri sayıya çevirir', () => {
    expect(toFiniteNumber('4.50')).toBe(4.5);
    expect(toFiniteNumber(null)).toBeNull();
  });
});
