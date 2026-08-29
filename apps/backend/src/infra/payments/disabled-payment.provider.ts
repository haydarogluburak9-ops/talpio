import { Injectable } from '@nestjs/common';

import { AppException } from '@common/errors/app.exception';

import type {
  CaptureRequest,
  PaymentIntent,
  PaymentOutcome,
  PaymentProvider,
  PaymentWebhookEvent,
  RefundRequest,
  WebhookRequest,
} from './payment-provider';

/**
 * Ödeme alınmayan sürümler için sağlayıcı.
 *
 * İlk sürümde platform üzerinden tahsilat yapılmıyor. Bu durumda `mock`
 * sürücüsünü seçmek tehlikeli olurdu: mock, para hareketi olmadan siparişi
 * "ödendi" işaretler ve satıcıya tahsil edilmemiş bir sipariş ödenmiş görünür.
 * Bu sağlayıcı ise her denemeyi açıkça reddeder, böylece ödeme yüzeyi yanlışlıkla
 * açılırsa sessizce yanlış veri üretmek yerine görünür biçimde durur.
 *
 * Gerçek tahsilata geçildiğinde `PAYMENT_DRIVER` değeri `iyzico` yapılır;
 * çağıran katmanda değişiklik gerekmez.
 */
@Injectable()
export class DisabledPaymentProvider implements PaymentProvider {
  readonly name = 'disabled';

  authorize(_intent: PaymentIntent): Promise<PaymentOutcome> {
    return Promise.reject(unavailable());
  }

  capture(_request: CaptureRequest): Promise<PaymentOutcome> {
    return Promise.reject(unavailable());
  }

  refund(_request: RefundRequest): Promise<PaymentOutcome> {
    return Promise.reject(unavailable());
  }

  parseWebhook(_request: WebhookRequest): PaymentWebhookEvent {
    // Tahsilat kapalıyken gelen webhook ya yanlış yapılandırma ya da sahte
    // istektir; ikisinde de gövdeye güvenilmez.
    throw new AppException('PAYMENT_WEBHOOK_INVALID', {
      message: 'Ödeme alma bu sürümde kapalı.',
    });
  }
}

function unavailable(): AppException {
  return new AppException('SERVICE_UNAVAILABLE', {
    message: 'Ödeme alma bu sürümde kapalı.',
  });
}
