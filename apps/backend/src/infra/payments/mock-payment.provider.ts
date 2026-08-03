import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';

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
 * Hata yolunun sınanabilmesi için belirlenmiş tetikleyici: kuruş hanesi 13 olan
 * tutarlar (ör. 2000,13 TL → 200013) daima reddedilir. Rastgele hata üretmek
 * duman testini kararsız yapardı.
 */
const FAILURE_TRIGGER_MINOR = 13;

const SIGNATURE_HEADER = 'x-ustapilot-signature';

const WEBHOOK_STATUSES: Record<string, PaymentStatus> = {
  'payment.captured': PaymentStatus.CAPTURED,
  'payment.failed': PaymentStatus.FAILED,
  'payment.refunded': PaymentStatus.REFUNDED,
};

interface MockWebhookBody {
  eventId?: unknown;
  type?: unknown;
  providerReference?: unknown;
  amountMinor?: unknown;
  failureReason?: unknown;
}

/**
 * Geliştirme ve test sağlayıcısı.
 *
 * Ağa çıkmaz, belirlenebilir davranır: aynı girdi daima aynı sonucu üretir.
 * Gerçek sağlayıcı bağlanana kadar ödeme akışının tamamı bu adaptörle çalışır.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  constructor(private readonly config: AppConfigService) {}

  authorize(intent: PaymentIntent): Promise<PaymentOutcome> {
    if (intent.amountMinor % 100 === FAILURE_TRIGGER_MINOR) {
      return Promise.resolve({
        status: PaymentStatus.FAILED,
        providerReference: null,
        failureReason: 'Kart provizyonu reddedildi.',
      });
    }

    return Promise.resolve({
      status: PaymentStatus.AUTHORIZED,
      providerReference: `mock_${randomUUID()}`,
      failureReason: null,
    });
  }

  capture(request: CaptureRequest): Promise<PaymentOutcome> {
    return Promise.resolve({
      status: PaymentStatus.CAPTURED,
      providerReference: request.providerReference,
      failureReason: null,
    });
  }

  refund(request: RefundRequest): Promise<PaymentOutcome> {
    return Promise.resolve({
      status: PaymentStatus.REFUNDED,
      providerReference: request.providerReference,
      failureReason: null,
    });
  }

  parseWebhook(request: WebhookRequest): PaymentWebhookEvent {
    const signature = request.headers[SIGNATURE_HEADER];

    if (!signature || !this.isSignatureValid(request.rawBody, signature)) {
      throw new AppException('PAYMENT_WEBHOOK_INVALID', {
        message: 'Webhook imzası doğrulanamadı.',
      });
    }

    const body = parseBody(request.rawBody);
    const status = typeof body.type === 'string' ? WEBHOOK_STATUSES[body.type] : undefined;

    if (!status || typeof body.providerReference !== 'string' || !body.providerReference) {
      throw new AppException('PAYMENT_WEBHOOK_INVALID', {
        message: 'Webhook gövdesi tanınmadı.',
      });
    }

    return {
      eventId: typeof body.eventId === 'string' ? body.eventId : randomUUID(),
      providerReference: body.providerReference,
      status,
      amountMinor: Number.isInteger(body.amountMinor) ? (body.amountMinor as number) : null,
      failureReason: typeof body.failureReason === 'string' ? body.failureReason : null,
    };
  }

  /** Uzunluk farkında `timingSafeEqual` fırlattığı için önce boy karşılaştırılır. */
  private isSignatureValid(rawBody: Buffer, signature: string): boolean {
    const expected = createHmac('sha256', this.config.payment.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expected.length !== signature.length) return false;

    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }
}

function parseBody(rawBody: Buffer): MockWebhookBody {
  try {
    const parsed: unknown = JSON.parse(rawBody.toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    throw new AppException('PAYMENT_WEBHOOK_INVALID', {
      message: 'Webhook gövdesi okunamadı.',
    });
  }
}
