import { MATCH_REASON, matchBusinessesToRequest } from './deterministic-matcher';

describe('deterministic-matcher', () => {
  const gaziantep = 'city-gaziantep';
  const sehitkamil = 'dist-sehitkamil';
  const oilCategory = 'cat-madeni-yag';
  const now = new Date('2026-08-13T12:00:00.000Z');

  const oilSeller = {
    id: 'biz-oil-a',
    isActive: true,
    verificationStatus: 'VERIFIED',
    minOrderQuantity: 50,
    categoryIds: [oilCategory],
    serviceAreas: new Map([[gaziantep, [sehitkamil, null]]]),
    lastActiveAt: new Date('2026-08-12T10:00:00.000Z'),
  };

  it('Gaziantep yağ tedarikçisini bulur ve açıklanabilir reasons üretir', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        deliveryCityId: gaziantep,
        deliveryDistrictId: sehitkamil,
        cityName: 'Gaziantep',
        quantity: 200,
      },
      [
        oilSeller,
        {
          id: 'biz-other',
          isActive: true,
          verificationStatus: 'VERIFIED',
          minOrderQuantity: null,
          categoryIds: ['cat-other'],
          serviceAreas: new Map([[gaziantep, [null]]]),
        },
      ],
      { now },
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]!.businessId).toBe('biz-oil-a');
    expect(matches[0]!.score).toBeGreaterThan(50);
    expect(matches[0]!.score).toBeLessThanOrEqual(100);
    expect(matches[0]!.reasons.codes).toEqual(
      expect.arrayContaining([
        MATCH_REASON.EXACT_CATEGORY,
        MATCH_REASON.DISTRICT_DELIVERY,
        MATCH_REASON.VERIFIED,
        MATCH_REASON.MIN_ORDER_OK,
        MATCH_REASON.ACTIVE_7D,
      ]),
    );
    expect(matches[0]!.reasons.labels).toEqual(
      expect.arrayContaining([
        'Exact category match',
        'Gaziantep district delivery available',
        'Verified supplier',
        'Active last 7 days',
      ]),
    );
  });

  it('min sipariş altındaki talebi eşleştirmez', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        deliveryCityId: gaziantep,
        deliveryDistrictId: null,
        quantity: 10,
      },
      [oilSeller],
      { now },
    );
    expect(matches).toHaveLength(0);
  });

  it('kapasite üstündeki talebi eşleştirmez', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        deliveryCityId: gaziantep,
        deliveryDistrictId: null,
        quantity: 5000,
      },
      [{ ...oilSeller, maxOrderQuantity: 1000 }],
      { now },
    );
    expect(matches).toHaveLength(0);
  });

  it('engellenmiş ilişkiyi eşleştirmez', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        deliveryCityId: gaziantep,
        deliveryDistrictId: null,
        quantity: 200,
      },
      [{ ...oilSeller, blockedWithBuyer: true }],
      { now },
    );
    expect(matches).toHaveLength(0);
  });

  it('pasif işletmeyi eşleştirmez', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        deliveryCityId: gaziantep,
        deliveryDistrictId: null,
        quantity: 200,
      },
      [{ ...oilSeller, isActive: false }],
      { now },
    );
    expect(matches).toHaveLength(0);
  });

  it('yanıt oranı ve spec overlap skor ekler', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        subcategoryId: 'sub-motor',
        deliveryCityId: gaziantep,
        deliveryDistrictId: null,
        quantity: 200,
        specificationKeys: ['viscosity', 'brand'],
      },
      [
        {
          ...oilSeller,
          responseRate: 0.8,
          supportedSpecKeys: ['viscosity', 'pack'],
        },
      ],
      { now },
    );

    expect(matches[0]!.reasons.codes).toEqual(
      expect.arrayContaining([
        MATCH_REASON.SUBCATEGORY_REQUESTED,
        MATCH_REASON.SPEC_OVERLAP,
        MATCH_REASON.RESPONSE_RATE,
      ]),
    );
    expect(matches[0]!.reasons.details.specOverlapCount).toBe(1);
    expect(matches[0]!.reasons.details.responseRatePct).toBe(80);
  });

  it('daha yüksek skorlu adayı öne alır', () => {
    const matches = matchBusinessesToRequest(
      {
        categoryId: oilCategory,
        deliveryCityId: gaziantep,
        deliveryDistrictId: sehitkamil,
        quantity: 200,
      },
      [
        {
          ...oilSeller,
          id: 'unverified',
          verificationStatus: 'UNVERIFIED',
          lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        oilSeller,
      ],
      { now },
    );

    expect(matches[0]!.businessId).toBe('biz-oil-a');
    expect(matches[0]!.score).toBeGreaterThan(matches[1]!.score);
  });
});
