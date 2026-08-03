import {
  JOB_STATUS_TONES,
  OFFER_STATUS_TONES,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_TONES,
  type SupportedLocale,
} from '@ustapilot/config';
import {
  jobStatusLabel,
  offerStatusLabel,
  orderStatusLabel,
  paymentStatusLabel,
} from '@ustapilot/localization';
import type { JobRequestStatus, OfferStatus, OrderStatus, PaymentStatus } from '@ustapilot/types';

import { Badge } from '@/components/badge';

/**
 * Durum rozeti. Renk tonu `@ustapilot/config`, metin ise
 * `@ustapilot/localization` üzerinden gelir; web ile birebir aynı kaynak.
 */
export function JobStatusPill({
  status,
  locale,
}: {
  status: JobRequestStatus;
  locale: SupportedLocale;
}) {
  return <Badge tone={JOB_STATUS_TONES[status]} label={jobStatusLabel(status, locale)} />;
}

export function OfferStatusPill({
  status,
  locale,
}: {
  status: OfferStatus;
  locale: SupportedLocale;
}) {
  return <Badge tone={OFFER_STATUS_TONES[status]} label={offerStatusLabel(status, locale)} />;
}

export function OrderStatusPill({
  status,
  locale,
}: {
  status: OrderStatus;
  locale: SupportedLocale;
}) {
  return <Badge tone={ORDER_STATUS_TONES[status]} label={orderStatusLabel(status, locale)} />;
}

export function PaymentStatusPill({
  status,
  locale,
}: {
  status: PaymentStatus;
  locale: SupportedLocale;
}) {
  return <Badge tone={PAYMENT_STATUS_TONES[status]} label={paymentStatusLabel(status, locale)} />;
}
