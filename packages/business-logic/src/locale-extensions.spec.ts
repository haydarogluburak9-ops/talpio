import { looksLikeE164, noopTaxAdapter } from './locale-extensions';

describe('locale-extensions', () => {
  it('vergi adaptörü oran uydurmaz', () => {
    expect(
      noopTaxAdapter({ amountMinor: 10000, currency: 'TRY', countryCode: 'TR' }),
    ).toEqual({ taxMinor: 0, taxCode: 'UNSET' });
  });

  it('E.164 iskeletini kabul eder', () => {
    expect(looksLikeE164('+905321234567')).toBe(true);
    expect(looksLikeE164('05321234567')).toBe(false);
  });
});
