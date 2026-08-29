import { Injectable } from '@nestjs/common';
import { COUNTRY_CURRENCY, LOCALE_CURRENCY, isKnownCurrency } from '@talpio/config';

import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Fiyatın hangi para biriminde etiketleneceğini tek noktadan çözer.
 *
 * Önceden her çağıran kendi `?? 'TRY'` yedeğini taşıyordu; sonuç, Berlin'deki
 * bir satıcının ilanının lira olarak işaretlenmesiydi. Sıra bilinçli olarak
 * açıktan kapalıya doğru: kullanıcının kendi seçimi, işletmenin ayarı, ülkesi,
 * dili ve en sonda kurulum varsayılanı.
 *
 * Hiçbir adımda uydurma kod üretilmez; bilinmeyen bir kod biçimlendiriciyi
 * patlatır ve fiyat hiç görünmez.
 */
@Injectable()
export class CurrencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  /** Kurulum genelindeki son çare. */
  get fallback(): string {
    const configured = this.config.defaultCurrency?.toUpperCase();
    return configured && isKnownCurrency(configured) ? configured : 'USD';
  }

  fromCountry(countryCode: string | null | undefined): string | null {
    if (!countryCode) return null;
    return COUNTRY_CURRENCY[countryCode.toUpperCase()] ?? null;
  }

  fromLocale(locale: string | null | undefined): string | null {
    if (!locale) return null;
    // `tr-TR` gibi etiketlerde yalnızca dil kısmı anlamlıdır.
    const base = locale.toLowerCase().split(/[-_]/)[0] ?? '';
    return LOCALE_CURRENCY[base] ?? null;
  }

  /** Geçerli bir koda normalize eder; değilse null. */
  normalize(currency: string | null | undefined): string | null {
    if (!currency) return null;
    const upper = currency.trim().toUpperCase();
    return isKnownCurrency(upper) ? upper : null;
  }

  /**
   * Kullanıcının para birimi.
   *
   * Tek sorgu ile çözülür; fiyat gösteren her uçta çağrıldığı için ek gidiş
   * dönüş eklemek istek yolunu uzatırdı.
   */
  async forUser(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true, countryCode: true, locale: true },
    });
    if (!user) return this.fallback;

    return (
      this.normalize(user.currency) ??
      this.fromCountry(user.countryCode) ??
      this.fromLocale(user.locale) ??
      this.fallback
    );
  }

  /**
   * İşletmenin fiyatlama para birimi.
   *
   * İşletme ayarı sahibinin tercihine baskındır: fiyatı belirleyen taraf
   * işletmedir ve sahibi kişisel görüntüleme dilini değiştirdiğinde yayınlanmış
   * ilanların para birimi kaymamalıdır.
   */
  async forBusiness(businessId: string): Promise<string> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        localeSettings: { select: { defaultCurrency: true, defaultCountryCode: true } },
        ownerUserId: true,
      },
    });
    if (!business) return this.fallback;

    const settings = business.localeSettings;
    const fromSettings =
      this.normalize(settings?.defaultCurrency) ?? this.fromCountry(settings?.defaultCountryCode);
    if (fromSettings) return fromSettings;

    return business.ownerUserId ? this.forUser(business.ownerUserId) : this.fallback;
  }

  /**
   * Yazar bir mağaza ise işletmenin, değilse kullanıcının para birimi.
   * Sosyal gönderi ve kampanya fiyatlarında kullanılır.
   */
  async forAuthor(businessId: string | null | undefined, userId: string): Promise<string> {
    return businessId ? this.forBusiness(businessId) : this.forUser(userId);
  }
}
