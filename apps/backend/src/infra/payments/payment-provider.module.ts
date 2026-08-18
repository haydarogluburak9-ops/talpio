import { Global, Module } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';

import { IyzicoPaymentProvider } from './iyzico.provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PAYMENT_PROVIDER, type PaymentProvider } from './payment-provider';

/**
 * Etkin ödeme sağlayıcısını ortam değişkeninden seçer.
 *
 * Yeni bir sağlayıcı eklemek, arayüzü uygulayan adaptörü yazıp buradaki
 * eşlemeye bir satır eklemekten ibarettir.
 */
function selectProvider(
  config: AppConfigService,
  mock: MockPaymentProvider,
  iyzico: IyzicoPaymentProvider,
): PaymentProvider {
  const driver = config.payment.driver;

  if (driver === 'mock') return mock;
  if (driver === 'iyzico') return iyzico;

  throw new Error(`Ödeme sağlayıcısı adaptörü henüz yazılmadı: ${driver}`);
}

@Global()
@Module({
  providers: [
    MockPaymentProvider,
    IyzicoPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [AppConfigService, MockPaymentProvider, IyzicoPaymentProvider],
      useFactory: selectProvider,
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentProviderModule {}
