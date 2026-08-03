import type { PaymentStatus } from '@ustapilot/types';

/** Nest DI belirteci; etkin sağlayıcı ortam değişkeninden seçilir. */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');

/** Tutarlar kuruş cinsinden tam sayıdır; para birimi her istekte taşınır. */
export interface PaymentIntent {
  orderId: string;
  amountMinor: number;
  currency: string;
  /** Sağlayıcıya iletilen istemci anahtarı; tekrar isteklerini ayırt eder. */
  idempotencyKey?: string | null;
}

export interface CaptureRequest {
  providerReference: string;
  amountMinor: number;
  currency: string;
}

export interface RefundRequest {
  providerReference: string;
  amountMinor: number;
  currency: string;
  reason?: string | null;
}

/**
 * Sağlayıcıdan bağımsız işlem sonucu.
 *
 * İş mantığı yalnızca bu üç alanı okur; sağlayıcıya özgü yanıt gövdeleri
 * adaptörün içinde kalır.
 */
export interface PaymentOutcome {
  status: PaymentStatus;
  /** Sağlayıcı tarafındaki kayıt kimliği. Başarısız denemede boş olabilir. */
  providerReference: string | null;
  failureReason: string | null;
}

export interface WebhookRequest {
  headers: Record<string, string | undefined>;
  /** Ham gövde; imza doğrulaması ayrıştırılmış nesne üzerinden yapılamaz. */
  rawBody: Buffer;
}

/**
 * Doğrulanmış webhook olayının normalleştirilmiş hâli.
 *
 * `eventId` yalnızca günlüğe yazılır; olayın iki kez işlenmesi ödemenin
 * mevcut durumuna bakılarak engellenir.
 */
export interface PaymentWebhookEvent {
  eventId: string;
  providerReference: string;
  status: PaymentStatus;
  amountMinor: number | null;
  failureReason: string | null;
}

/**
 * Ödeme sağlayıcısı sözleşmesi.
 *
 * Gerçek bir sağlayıcı (iyzico, PayTR ...) devreye girdiğinde yalnızca bu
 * arayüzü uygulayan tek bir adaptör dosyası yazılır; çağıran katman değişmez.
 */
export interface PaymentProvider {
  /** `Payment.providerName` alanına yazılan sağlayıcı adı. */
  readonly name: string;

  authorize(intent: PaymentIntent): Promise<PaymentOutcome>;

  capture(request: CaptureRequest): Promise<PaymentOutcome>;

  refund(request: RefundRequest): Promise<PaymentOutcome>;

  /**
   * Webhook isteğini doğrular ve normalleştirir.
   *
   * İmza geçersizse `PAYMENT_WEBHOOK_INVALID` fırlatır; gövdeye asla
   * doğrulama öncesinde güvenilmez.
   */
  parseWebhook(request: WebhookRequest): PaymentWebhookEvent;
}
