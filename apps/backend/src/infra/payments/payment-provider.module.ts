import { Global, Module } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';

import { MockPaymentProvider } from './mock-payment.provider';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';

/**
 * Etkin ödeme sağlayıcısını ortam değişkeninden seçer.
 *
 * Yeni bir sağlayıcı eklemek, arayüzü uygulayan adaptörü yazıp buradaki
 * eşlemeye bir satır eklemekten ibarettir.
 */
function selectProvider(config: AppConfigService, mock: MockPaymentProvider): PaymentProvider {
  const driver = config.payment.driver;

  if (driver === 'mock') return mock;

  // Ayakta kalıp her ödemede hata vermektense açılışta durmak yeğdir.
  throw new Error(`Ödeme sağlayıcısı adaptörü henüz yazılmadı: ${driver}`);
}

@Global()
@Module({
  providers: [
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [AppConfigService, MockPaymentProvider],
      useFactory: selectProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentProviderModule {}
