import { JobRequestStatus, OfferStatus, OrderStatus } from '@ustapilot/types';

/**
 * İzin verilen iş durumu geçişleri. Bu tablo tek kaynaktır: backend geçişi
 * uygulamadan önce, istemciler ise düğmeleri göstermeden önce buraya bakar.
 */
export const JOB_STATUS_TRANSITIONS: Record<JobRequestStatus, readonly JobRequestStatus[]> = {
  [JobRequestStatus.DRAFT]: [JobRequestStatus.PUBLISHED, JobRequestStatus.CANCELLED],
  [JobRequestStatus.PUBLISHED]: [
    JobRequestStatus.OFFERS_RECEIVED,
    JobRequestStatus.CANCELLED,
  ],
  [JobRequestStatus.OFFERS_RECEIVED]: [
    JobRequestStatus.PROVIDER_SELECTED,
    JobRequestStatus.CANCELLED,
  ],
  [JobRequestStatus.PROVIDER_SELECTED]: [
    JobRequestStatus.SCHEDULED,
    JobRequestStatus.CANCELLED,
    JobRequestStatus.DISPUTED,
  ],
  [JobRequestStatus.SCHEDULED]: [
    JobRequestStatus.PROVIDER_EN_ROUTE,
    JobRequestStatus.IN_PROGRESS,
    JobRequestStatus.CANCELLED,
    JobRequestStatus.DISPUTED,
  ],
  [JobRequestStatus.PROVIDER_EN_ROUTE]: [
    JobRequestStatus.IN_PROGRESS,
    JobRequestStatus.CANCELLED,
    JobRequestStatus.DISPUTED,
  ],
  [JobRequestStatus.IN_PROGRESS]: [
    JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
    JobRequestStatus.DISPUTED,
  ],
  [JobRequestStatus.AWAITING_CUSTOMER_APPROVAL]: [
    JobRequestStatus.COMPLETED,
    JobRequestStatus.DISPUTED,
  ],
  [JobRequestStatus.COMPLETED]: [JobRequestStatus.DISPUTED],
  [JobRequestStatus.CANCELLED]: [],
  [JobRequestStatus.DISPUTED]: [
    JobRequestStatus.REFUNDING,
    JobRequestStatus.COMPLETED,
    JobRequestStatus.CANCELLED,
  ],
  [JobRequestStatus.REFUNDING]: [JobRequestStatus.CANCELLED],
};

export const OFFER_STATUS_TRANSITIONS: Record<OfferStatus, readonly OfferStatus[]> = {
  [OfferStatus.DRAFT]: [OfferStatus.SUBMITTED],
  [OfferStatus.SUBMITTED]: [
    OfferStatus.ACCEPTED,
    OfferStatus.REJECTED,
    OfferStatus.WITHDRAWN,
    OfferStatus.EXPIRED,
  ],
  [OfferStatus.ACCEPTED]: [],
  [OfferStatus.REJECTED]: [],
  [OfferStatus.WITHDRAWN]: [],
  [OfferStatus.EXPIRED]: [],
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED, OrderStatus.DISPUTED],
  [OrderStatus.IN_PROGRESS]: [OrderStatus.AWAITING_APPROVAL, OrderStatus.DISPUTED],
  [OrderStatus.AWAITING_APPROVAL]: [OrderStatus.COMPLETED, OrderStatus.DISPUTED],
  [OrderStatus.COMPLETED]: [OrderStatus.DISPUTED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.DISPUTED]: [OrderStatus.REFUNDED, OrderStatus.COMPLETED],
  [OrderStatus.REFUNDED]: [],
};

function canTransition<T extends string>(
  table: Record<T, readonly T[]>,
  from: T,
  to: T,
): boolean {
  return table[from]?.includes(to) ?? false;
}

export function canTransitionJobStatus(
  from: JobRequestStatus,
  to: JobRequestStatus,
): boolean {
  return canTransition(JOB_STATUS_TRANSITIONS, from, to);
}

export function canTransitionOfferStatus(from: OfferStatus, to: OfferStatus): boolean {
  return canTransition(OFFER_STATUS_TRANSITIONS, from, to);
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return canTransition(ORDER_STATUS_TRANSITIONS, from, to);
}

export function nextJobStatuses(from: JobRequestStatus): readonly JobRequestStatus[] {
  return JOB_STATUS_TRANSITIONS[from] ?? [];
}

/** Bir teklifin kabul edilip edilemeyeceği: durum, süre ve iş durumu birlikte. */
export function canAcceptOffer(input: {
  offerStatus: OfferStatus;
  jobStatus: JobRequestStatus;
  validUntil: Date;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  if (input.offerStatus !== OfferStatus.SUBMITTED) return false;
  if (input.validUntil.getTime() <= now.getTime()) return false;
  return canTransitionJobStatus(input.jobStatus, JobRequestStatus.PROVIDER_SELECTED);
}
