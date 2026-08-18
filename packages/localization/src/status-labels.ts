import { DEFAULT_LOCALE } from '@talpio/config';
import type {
  ComplaintStatus,
  ComplaintSubjectType,
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  SupportTicketStatus,
  TransactionType,
} from '@talpio/types';

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

export function supportTicketStatusLabel(
  status: SupportTicketStatus,
  locale: string = DEFAULT_LOCALE,
): string {
  return messagesFor(locale).supportTicketStatus[status] ?? status;
}

export function complaintStatusLabel(
  status: ComplaintStatus,
  locale: string = DEFAULT_LOCALE,
): string {
  return messagesFor(locale).complaintStatus[status] ?? status;
}

export function complaintSubjectTypeLabel(
  subjectType: ComplaintSubjectType,
  locale: string = DEFAULT_LOCALE,
): string {
  return messagesFor(locale).complaintSubjectType[subjectType] ?? subjectType;
}
