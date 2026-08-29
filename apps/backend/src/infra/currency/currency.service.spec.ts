import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';

import { CurrencyService } from './currency.service';

function createService(options: {
  user?: { currency: string | null; countryCode: string | null; locale: string } | null;
  business?: {
    localeSettings: { defaultCurrency: string; defaultCountryCode: string } | null;
    ownerUserId: string | null;
  } | null;
  configured?: string;
}) {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(options.user ?? null) },
    business: { findUnique: jest.fn().mockResolvedValue(options.business ?? null) },
  } as unknown as PrismaService;

  const config = { defaultCurrency: options.configured ?? 'USD' } as unknown as AppConfigService;

  return new CurrencyService(prisma, config);
}

describe('CurrencyService', () => {
  describe('kullanıcı çözümlemesi', () => {
    it('açık tercihi her şeyin önüne alır', async () => {
      const service = createService({
        user: { currency: 'GBP', countryCode: 'DE', locale: 'tr' },
      });

      await expect(service.forUser('u1')).resolves.toBe('GBP');
    });

    it('tercih yoksa ülkeye düşer', async () => {
      const service = createService({
        user: { currency: null, countryCode: 'DE', locale: 'tr' },
      });

      await expect(service.forUser('u1')).resolves.toBe('EUR');
    });

    it('ülke de yoksa dile düşer', async () => {
      const service = createService({
        user: { currency: null, countryCode: null, locale: 'de' },
      });

      await expect(service.forUser('u1')).resolves.toBe('EUR');
    });

    it('hiçbiri yoksa kurulum varsayılanına düşer', async () => {
      const service = createService({
        user: { currency: null, countryCode: null, locale: 'xx' },
      });

      await expect(service.forUser('u1')).resolves.toBe('USD');
    });

    // Geçersiz kod biçimlendiriciyi patlatır ve fiyat hiç görünmez; bu yüzden
    // saklanmış bozuk bir değer sessizce kabul edilmemeli.
    it('tanınmayan tercihi yok sayıp türetmeye devam eder', async () => {
      const service = createService({
        user: { currency: 'XXX', countryCode: 'JP', locale: 'tr' },
      });

      await expect(service.forUser('u1')).resolves.toBe('JPY');
    });

    it('kullanıcı bulunamazsa varsayılana düşer', async () => {
      const service = createService({ user: null });

      await expect(service.forUser('yok')).resolves.toBe('USD');
    });
  });

  describe('işletme çözümlemesi', () => {
    it('mağaza ayarını sahibin tercihinin önüne alır', async () => {
      const service = createService({
        business: {
          localeSettings: { defaultCurrency: 'SGD', defaultCountryCode: 'SG' },
          ownerUserId: 'u1',
        },
        user: { currency: 'TRY', countryCode: 'TR', locale: 'tr' },
      });

      await expect(service.forBusiness('b1')).resolves.toBe('SGD');
    });

    it('mağaza ayarı yoksa sahibin para birimine düşer', async () => {
      const service = createService({
        business: { localeSettings: null, ownerUserId: 'u1' },
        user: { currency: null, countryCode: 'BR', locale: 'en' },
      });

      await expect(service.forBusiness('b1')).resolves.toBe('BRL');
    });

    it('ayarda para birimi bozuksa ülke kodundan türetir', async () => {
      const service = createService({
        business: {
          localeSettings: { defaultCurrency: '', defaultCountryCode: 'JP' },
          ownerUserId: 'u1',
        },
      });

      await expect(service.forBusiness('b1')).resolves.toBe('JPY');
    });
  });

  describe('normalize', () => {
    it('küçük harfi ve boşluğu düzeltir', () => {
      const service = createService({});

      expect(service.normalize(' eur ')).toBe('EUR');
    });

    it('katalogda olmayan kodu reddeder', () => {
      const service = createService({});

      expect(service.normalize('ZZZ')).toBeNull();
      expect(service.normalize(null)).toBeNull();
    });
  });

  it('yapılandırılmış varsayılan geçersizse dolara düşer', () => {
    const service = createService({ configured: 'ZZZ' });

    expect(service.fallback).toBe('USD');
  });
});
