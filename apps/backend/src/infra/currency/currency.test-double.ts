import type { CurrencyService } from './currency.service';

/**
 * Testlerde para birimi çözümleyicisi yerine geçen sabit.
 *
 * Bilerek 'EUR' döner: 'TRY' dönseydi, sabit lira yedeğinin geri sızdığı bir
 * gerileme testlerden sessizce geçerdi.
 */
export function currencyDouble(code = 'EUR'): CurrencyService {
  return {
    fallback: code,
    forUser: jest.fn().mockResolvedValue(code),
    forBusiness: jest.fn().mockResolvedValue(code),
    forAuthor: jest.fn().mockResolvedValue(code),
    fromCountry: jest.fn().mockReturnValue(code),
    fromLocale: jest.fn().mockReturnValue(code),
    normalize: jest.fn((value: string | null | undefined) => value?.toUpperCase() ?? null),
  } as unknown as CurrencyService;
}
