/** Genel varlık durumu. Soft delete ile birlikte kullanılır. */
export const RecordStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus];

export const UserStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  DEACTIVATED: 'DEACTIVATED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/**
 * İş talebinin yaşam döngüsü. Geçerli geçişler
 * `packages/business-logic` içinde `JOB_STATUS_TRANSITIONS` ile tanımlıdır.
 */
export const JobRequestStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  OFFERS_RECEIVED: 'OFFERS_RECEIVED',
  PROVIDER_SELECTED: 'PROVIDER_SELECTED',
  SCHEDULED: 'SCHEDULED',
  PROVIDER_EN_ROUTE: 'PROVIDER_EN_ROUTE',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_CUSTOMER_APPROVAL: 'AWAITING_CUSTOMER_APPROVAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
  REFUNDING: 'REFUNDING',
} as const;

export type JobRequestStatus = (typeof JobRequestStatus)[keyof typeof JobRequestStatus];

/** Ustaların yeni teklif verebildiği durumlar. */
export const OFFERABLE_JOB_STATUSES: readonly JobRequestStatus[] = [
  JobRequestStatus.PUBLISHED,
  JobRequestStatus.OFFERS_RECEIVED,
];

/** İşin artık değiştirilemez sayıldığı bitiş durumları. */
export const TERMINAL_JOB_STATUSES: readonly JobRequestStatus[] = [
  JobRequestStatus.COMPLETED,
  JobRequestStatus.CANCELLED,
];

export const OfferStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  WITHDRAWN: 'WITHDRAWN',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

/** Teklif fiyatının nasıl yorumlanacağı. */
export const OfferPriceType = {
  FIXED: 'FIXED',
  STARTING_FROM: 'STARTING_FROM',
  AFTER_INSPECTION: 'AFTER_INSPECTION',
  HOURLY: 'HOURLY',
} as const;

export type OfferPriceType = (typeof OfferPriceType)[keyof typeof OfferPriceType];

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  SETTLED: 'SETTLED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const TransactionType = {
  PAYMENT: 'PAYMENT',
  COMMISSION: 'COMMISSION',
  PAYOUT: 'PAYOUT',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
  SUBSCRIPTION: 'SUBSCRIPTION',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const CommissionType = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
  HYBRID: 'HYBRID',
} as const;

export type CommissionType = (typeof CommissionType)[keyof typeof CommissionType];

export const DocumentType = {
  IDENTITY: 'IDENTITY',
  TAX_CERTIFICATE: 'TAX_CERTIFICATE',
  CRAFTSMANSHIP_CERTIFICATE: 'CRAFTSMANSHIP_CERTIFICATE',
  VOCATIONAL_QUALIFICATION: 'VOCATIONAL_QUALIFICATION',
  INSURANCE: 'INSURANCE',
  OTHER: 'OTHER',
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];

export const DocumentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const ComplaintStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const SupportTicketStatus = {
  OPEN: 'OPEN',
  WAITING_CUSTOMER: 'WAITING_CUSTOMER',
  WAITING_SUPPORT: 'WAITING_SUPPORT',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type SupportTicketStatus = (typeof SupportTicketStatus)[keyof typeof SupportTicketStatus];

export const ReviewStatus = {
  PUBLISHED: 'PUBLISHED',
  PENDING_MODERATION: 'PENDING_MODERATION',
  HIDDEN: 'HIDDEN',
} as const;

export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];
