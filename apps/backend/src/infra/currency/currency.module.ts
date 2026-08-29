import { Global, Module } from '@nestjs/common';

import { CurrencyService } from './currency.service';

/**
 * Genel kapsamlı: fiyat gösteren neredeyse her modül para birimi çözümlemesine
 * ihtiyaç duyuyor ve her birine ayrı ayrı import ettirmek, unutulan bir modülde
 * yeniden sabit yedeğe düşülmesi anlamına gelirdi.
 */
@Global()
@Module({
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
