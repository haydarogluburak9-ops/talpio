import { DEFAULT_LOCALE } from '@ustapilot/config';
import type {
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  TransactionType,
} from '@ustapilot/types';

import { messagesFor } from './translator';

export function jobStatusLabel(
  status: JobRequestStatus,
  locale: string = DEFAULT_LOCALE,
): string {
  return messagesFor(locale).jobStatus[status] ?? status;
}

export function offerStatusLabel(status: OfferStatus, locale: string = DEFAULT_LOCALE): string {
  return messagesFor(locale).offerStatus[status] ?? status;
}

export function orderStatusLabel(status: OrderStatus, locale: string = DEFAULT_LOCALE): string {
  return messagesFor(locale).orderStatus[status] ?? status;
}

export function paymentStatusLabel(
  status: PaymentStatus,
  locale: string = DEFAULT_LOCALE,
): string {
  return messagesFor(locale).paymentStatus[status] ?? status;
}

export function transactionTypeLabel(
  type: TransactionType,
  locale: string = DEFAULT_LOCALE,
): string {
  return messagesFor(locale).transactionType[type] ?? type;
}
