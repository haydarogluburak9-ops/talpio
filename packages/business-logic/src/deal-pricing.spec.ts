import { computeDiscountPercent } from './deal-pricing';

describe('computeDiscountPercent', () => {
  it('liste ve fırsat fiyatından yüzde üretir', () => {
    expect(computeDiscountPercent(10000, 8000)).toBe(20);
  });

  it('fırsat listeyi geçerse 0 döner, negatif basmaz', () => {
    expect(computeDiscountPercent(10000, 12000)).toBe(0);
  });

  it('eksik fiyatta null döner', () => {
    expect(computeDiscountPercent(null, 8000)).toBeNull();
    expect(computeDiscountPercent(0, 0)).toBeNull();
  });
});
