import { JobTimeSlot, OfferPriceType } from '@talpio/types';

import { createJobRequestSchema, jobWizardStepSchemas } from './job';
import { createOfferSchema } from './offer';

const CATEGORY_ID = '0192f3a0-1111-7000-8000-000000000001';
const CITY_ID = '0192f3a0-1111-7000-8000-000000000002';
const DISTRICT_ID = '0192f3a0-1111-7000-8000-000000000003';
const JOB_ID = '0192f3a0-1111-7000-8000-000000000004';

const validJob = {
  categoryId: CATEGORY_ID,
  title: 'Mutfak lavabosu tıkandı',
  description:
    'Mutfak lavabosu iki gündür tıkalı, su çok yavaş iniyor. Sifon açıldı ama düzelmedi.',
  address: { cityId: CITY_ID, districtId: DISTRICT_ID },
};

describe('createJobRequestSchema', () => {
  it('geçerli talebi kabul eder', () => {
    expect(createJobRequestSchema.safeParse(validJob).success).toBe(true);
  });

  it('belirtilmeyen alanlara varsayılan atar', () => {
    const result = createJobRequestSchema.parse(validJob);

    expect(result.isUrgent).toBe(false);
    expect(result.inspectionRequired).toBe(false);
    expect(result.attachmentFileIds).toEqual([]);
    expect(result.preferredTimeSlot).toBe(JobTimeSlot.FLEXIBLE);
  });

  it('kısa başlığı reddeder', () => {
    const result = createJobRequestSchema.safeParse({ ...validJob, title: 'Tıkalı' });
    expect(result.success).toBe(false);
  });

  it('kısa açıklamayı reddeder', () => {
    const result = createJobRequestSchema.safeParse({ ...validJob, description: 'Tıkandı' });
    expect(result.success).toBe(false);
  });

  it('adres olmadan reddeder', () => {
    const { address: _address, ...withoutAddress } = validJob;
    expect(createJobRequestSchema.safeParse(withoutAddress).success).toBe(false);
  });

  it('negatif bütçeyi reddeder', () => {
    const result = createJobRequestSchema.safeParse({ ...validJob, budgetMinor: -100 });
    expect(result.success).toBe(false);
  });

  it('belirli bir zaman dilimi seçilip tarih verilmediğinde reddeder', () => {
    const result = createJobRequestSchema.safeParse({
      ...validJob,
      preferredTimeSlot: JobTimeSlot.MORNING,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['preferredDate']);
  });

  it('zaman dilimiyle birlikte tarih verildiğinde kabul eder', () => {
    const result = createJobRequestSchema.safeParse({
      ...validJob,
      preferredTimeSlot: JobTimeSlot.MORNING,
      preferredDate: '2026-08-01T09:00:00.000Z',
    });

    expect(result.success).toBe(true);
  });
});

describe('jobWizardStepSchemas', () => {
  it('kategori adımı yalnızca kategori bilgisini doğrular', () => {
    expect(jobWizardStepSchemas.category.safeParse({ categoryId: CATEGORY_ID }).success).toBe(true);
  });

  it('detay adımı kısa açıklamayı reddeder', () => {
    const result = jobWizardStepSchemas.details.safeParse({
      title: validJob.title,
      description: 'kısa',
    });

    expect(result.success).toBe(false);
  });

  it('konum adımı ilçe olmadan geçmez', () => {
    const result = jobWizardStepSchemas.location.safeParse({ address: { cityId: CITY_ID } });
    expect(result.success).toBe(false);
  });
});

describe('createOfferSchema', () => {
  const validOffer = {
    jobRequestId: JOB_ID,
    priceType: OfferPriceType.FIXED,
    amountMinor: 150_000,
  };

  it('geçerli teklifi kabul eder', () => {
    expect(createOfferSchema.safeParse(validOffer).success).toBe(true);
  });

  it('varsayılan geçerlilik süresi atar', () => {
    const result = createOfferSchema.parse(validOffer);
    expect(result.validityHours).toBe(72);
    expect(result.materialsIncluded).toBe(false);
  });

  it('çok düşük tutarı reddeder', () => {
    const result = createOfferSchema.safeParse({ ...validOffer, amountMinor: 100 });
    expect(result.success).toBe(false);
  });

  it('ondalıklı kuruş tutarını reddeder', () => {
    const result = createOfferSchema.safeParse({ ...validOffer, amountMinor: 150_000.5 });
    expect(result.success).toBe(false);
  });

  it('keşif sonrası fiyatta açıklama zorunludur', () => {
    const result = createOfferSchema.safeParse({
      ...validOffer,
      priceType: OfferPriceType.AFTER_INSPECTION,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['note']);
  });

  it('keşif sonrası fiyat açıklamayla kabul edilir', () => {
    const result = createOfferSchema.safeParse({
      ...validOffer,
      priceType: OfferPriceType.AFTER_INSPECTION,
      note: 'Kesin fiyat yerinde görüldükten sonra netleşecek.',
    });

    expect(result.success).toBe(true);
  });

  it('geçerlilik süresi alt sınırın altında olamaz', () => {
    const result = createOfferSchema.safeParse({ ...validOffer, validityHours: 1 });
    expect(result.success).toBe(false);
  });
});
