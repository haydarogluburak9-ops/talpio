import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@talpio/types';

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

const SIGNATURE_HEADER = 'x-iyzico-signature';

export function iyzicoAuthorizationHeader(
  apiKey: string,
  secretKey: string,
  uri: string,
  body: string,
  randomKey = `${Date.now()}`,
): string {
  const payload = randomKey + uri + body;
  const signature = createHmac('sha256', secretKey).update(payload).digest('hex');
  const auth = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(auth).toString('base64')}`;
}

/** Gövde doğrulanmamış JSON; nesne gelirse `[object Object]` yazmayalım. */
function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function toOutcome(json: Record<string, unknown>, fallbackRef: string | null): PaymentOutcome {
  const status = text(json.status).toLowerCase();
  const paymentId = json.paymentId != null ? text(json.paymentId) : fallbackRef;
  if (status === 'success') {
    return {
      status: PaymentStatus.AUTHORIZED,
      providerReference: paymentId,
      failureReason: null,
    };
  }
  return {
    status: PaymentStatus.FAILED,
    providerReference: paymentId,
    failureReason: text(json.errorMessage) || text(json.errorCode) || 'iyzico işlem başarısız',
  };
}

/**
 * iyzico Payment API HTTP istemcisi.
 * 3DS / Checkout Form UI bu katmanda yoktur; sunucu-sunucu authorize.
 */
@Injectable()
export class IyzicoPaymentProvider implements PaymentProvider {
  readonly name = 'iyzico';

  constructor(private readonly config: AppConfigService) {}

  async authorize(intent: PaymentIntent): Promise<PaymentOutcome> {
    return this.request('/payment/auth', {
      locale: 'tr',
      conversationId: intent.idempotencyKey ?? intent.orderId,
      price: (intent.amountMinor / 100).toFixed(2),
      paidPrice: (intent.amountMinor / 100).toFixed(2),
      currency: intent.currency,
      installment: '1',
      basketId: intent.orderId,
      paymentChannel: 'WEB',
      paymentGroup: 'PRODUCT',
      buyer: {
        id: intent.orderId,
        name: 'Talpio',
        surname: 'Alici',
        gsmNumber: '+905350000000',
        email: `order-${intent.orderId.replace(/[^a-zA-Z0-9]/g, '')}@talpio.invalid`,
        identityNumber: '11111111111',
        registrationAddress: 'Turkiye',
        ip: '127.0.0.1',
        city: 'Istanbul',
        country: 'Turkey',
      },
      billingAddress: {
        contactName: 'Talpio Alici',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkiye',
      },
      basketItems: [
        {
          id: intent.orderId,
          name: `Siparis ${intent.orderId.slice(0, 8)}`,
          category1: 'Talpio',
          itemType: 'VIRTUAL',
          price: (intent.amountMinor / 100).toFixed(2),
        },
      ],
    });
  }

  async capture(request: CaptureRequest): Promise<PaymentOutcome> {
    return this.request('/payment/postauth', {
      locale: 'tr',
      conversationId: request.providerReference,
      paymentId: request.providerReference,
      paidPrice: (request.amountMinor / 100).toFixed(2),
      currency: request.currency,
    });
  }

  async refund(request: RefundRequest): Promise<PaymentOutcome> {
    return this.request('/payment/refund', {
      locale: 'tr',
      conversationId: request.providerReference,
      paymentId: request.providerReference,
      price: (request.amountMinor / 100).toFixed(2),
      currency: request.currency,
      ip: '127.0.0.1',
    });
  }

  parseWebhook(request: WebhookRequest): PaymentWebhookEvent {
    const signature = request.headers[SIGNATURE_HEADER] ?? request.headers['x-talpio-signature'];
    if (!signature) {
      throw new AppException('PAYMENT_WEBHOOK_INVALID', { message: 'İmza başlığı yok.' });
    }
    const expected = createHmac('sha256', this.config.payment.webhookSecret)
      .update(request.rawBody)
      .digest('hex');
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new AppException('PAYMENT_WEBHOOK_INVALID', { message: 'İmza geçersiz.' });
    }

    const body = JSON.parse(request.rawBody.toString('utf8')) as {
      eventId?: string;
      providerReference?: string;
      paymentId?: string;
      status?: string;
      amountMinor?: number;
      failureReason?: string | null;
    };

    return {
      eventId: String(body.eventId ?? randomUUID()),
      providerReference: String(body.providerReference ?? body.paymentId ?? ''),
      status: (body.status as PaymentStatus) ?? PaymentStatus.FAILED,
      amountMinor: body.amountMinor ?? null,
      failureReason: body.failureReason ?? null,
    };
  }

  private async request(uri: string, payload: Record<string, unknown>): Promise<PaymentOutcome> {
    const apiKey = this.config.payment.iyzicoApiKey;
    const secretKey = this.config.payment.iyzicoSecretKey;
    if (!apiKey || !secretKey) {
      return {
        status: PaymentStatus.FAILED,
        providerReference: null,
        failureReason: 'IYZICO_API_KEY / IYZICO_SECRET_KEY yapılandırılmamış.',
      };
    }

    const body = JSON.stringify(payload);
    const response = await fetch(`${this.config.payment.iyzicoBaseUrl}${uri}`, {
      method: 'POST',
      headers: {
        Authorization: iyzicoAuthorizationHeader(apiKey, secretKey, uri, body),
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(20_000),
    });

    let json: Record<string, unknown>;
    try {
      json = (await response.json()) as Record<string, unknown>;
    } catch {
      return {
        status: PaymentStatus.FAILED,
        providerReference: null,
        failureReason: `iyzico yanıtı okunamadı (HTTP ${response.status}).`,
      };
    }

    if (!response.ok && !json.status) {
      return {
        status: PaymentStatus.FAILED,
        providerReference: null,
        failureReason: `iyzico HTTP ${response.status}`,
      };
    }

    const outcome = toOutcome(json, typeof json.paymentId === 'string' ? json.paymentId : null);
    if (uri === '/payment/postauth' && outcome.status === PaymentStatus.AUTHORIZED) {
      return { ...outcome, status: PaymentStatus.CAPTURED };
    }
    if (uri === '/payment/refund' && outcome.status === PaymentStatus.AUTHORIZED) {
      return { ...outcome, status: PaymentStatus.REFUNDED };
    }
    return outcome;
  }
}
