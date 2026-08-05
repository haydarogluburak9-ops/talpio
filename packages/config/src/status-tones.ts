import {
  ComplaintStatus,
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  SupportTicketStatus,
} from '@ustapilot/types';

/**
 * Durum → renk tonu eşlemesi. Ton adları anlamsaldır; web (Tailwind sınıfı) ve
 * mobil (StyleSheet rengi) aynı adı kendi teknolojisine çevirir. Böylece bir
 * durumun rengi tek yerden yönetilir.
 *
 * Etiket metni burada tutulmaz; çeviriler `@ustapilot/localization` içindedir.
 */
export type StatusTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export const JOB_STATUS_TONES: Record<JobRequestStatus, StatusTone> = {
  [JobRequestStatus.DRAFT]: 'neutral',
  [JobRequestStatus.PUBLISHED]: 'info',
  [JobRequestStatus.OFFERS_RECEIVED]: 'brand',
  [JobRequestStatus.PROVIDER_SELECTED]: 'brand',
  [JobRequestStatus.SCHEDULED]: 'brand',
  [JobRequestStatus.PROVIDER_EN_ROUTE]: 'accent',
  [JobRequestStatus.IN_PROGRESS]: 'accent',
  [JobRequestStatus.AWAITING_CUSTOMER_APPROVAL]: 'warning',
  [JobRequestStatus.COMPLETED]: 'success',
  [JobRequestStatus.CANCELLED]: 'neutral',
  [JobRequestStatus.DISPUTED]: 'danger',
  [JobRequestStatus.REFUNDING]: 'warning',
};

export const OFFER_STATUS_TONES: Record<OfferStatus, StatusTone> = {
  [OfferStatus.DRAFT]: 'neutral',
  [OfferStatus.SUBMITTED]: 'info',
  [OfferStatus.WITHDRAWN]: 'neutral',
  [OfferStatus.ACCEPTED]: 'success',
  [OfferStatus.REJECTED]: 'danger',
  [OfferStatus.EXPIRED]: 'neutral',
};

export const ORDER_STATUS_TONES: Record<OrderStatus, StatusTone> = {
  [OrderStatus.PENDING_PAYMENT]: 'warning',
  [OrderStatus.PAID]: 'info',
  [OrderStatus.IN_PROGRESS]: 'accent',
  [OrderStatus.AWAITING_APPROVAL]: 'warning',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'neutral',
  [OrderStatus.REFUNDED]: 'neutral',
  [OrderStatus.DISPUTED]: 'danger',
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, StatusTone> = {
  [PaymentStatus.PENDING]: 'warning',
  [PaymentStatus.AUTHORIZED]: 'info',
  [PaymentStatus.CAPTURED]: 'success',
  [PaymentStatus.SETTLED]: 'success',
  [PaymentStatus.FAILED]: 'danger',
  [PaymentStatus.REFUNDED]: 'neutral',
  [PaymentStatus.PARTIALLY_REFUNDED]: 'warning',
};

export const SUPPORT_TICKET_STATUS_TONES: Record<SupportTicketStatus, StatusTone> = {
  [SupportTicketStatus.OPEN]: 'info',
  [SupportTicketStatus.WAITING_CUSTOMER]: 'warning',
  [SupportTicketStatus.WAITING_SUPPORT]: 'brand',
  [SupportTicketStatus.RESOLVED]: 'success',
  [SupportTicketStatus.CLOSED]: 'neutral',
};

export const COMPLAINT_STATUS_TONES: Record<ComplaintStatus, StatusTone> = {
  [ComplaintStatus.OPEN]: 'warning',
  [ComplaintStatus.UNDER_REVIEW]: 'info',
  [ComplaintStatus.RESOLVED]: 'success',
  [ComplaintStatus.REJECTED]: 'danger',
};
