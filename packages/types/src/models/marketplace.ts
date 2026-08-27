import type {
  JobRequestStatus,
  OfferPriceType,
  OfferStatus,
  OrderStatus,
  ReviewStatus,
} from '../enums/statuses';
import type { BaseEntity, Money } from './common';
import type { CategoryRef, MaskedAddress } from './catalog';
import type { ProviderSummary } from './identity';

export const JobSize = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  UNKNOWN: 'UNKNOWN',
} as const;

export type JobSize = (typeof JobSize)[keyof typeof JobSize];

export const JobTimeSlot = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING',
  FLEXIBLE: 'FLEXIBLE',
} as const;

export type JobTimeSlot = (typeof JobTimeSlot)[keyof typeof JobTimeSlot];

export interface JobAttachment {
  id: string;
  fileId: string;
  url: string;
  thumbnailUrl?: string | null;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
}

export interface JobStatusHistoryEntry {
  id: string;
  fromStatus?: JobRequestStatus | null;
  toStatus: JobRequestStatus;
  changedByUserId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface JobRequest extends BaseEntity {
  customerId: string;
  category: CategoryRef;
  subcategory?: CategoryRef | null;
  title: string;
  description: string;
  status: JobRequestStatus;
  isUrgent: boolean;
  size: JobSize;
  materialsIncluded?: boolean | null;
  inspectionRequired: boolean;
  /** Müşterinin yaklaşık bütçesi. Zorunlu değildir. */
  budget?: Money | null;
  problemStartedAt?: string | null;
  preferredDate?: string | null;
  preferredTimeSlot: JobTimeSlot;
  address: MaskedAddress;
  attachments: JobAttachment[];
  offerCount: number;
  publishedAt?: string | null;
  expiresAt?: string | null;
}

export interface Offer extends BaseEntity {
  jobRequestId: string;
  providerProfileId: string;
  provider?: ProviderSummary;
  status: OfferStatus;
  price: Money;
  priceType: OfferPriceType;
  /** Tahmini iş süresi (dakika). */
  estimatedDurationMinutes?: number | null;
  availableFrom?: string | null;
  materialsIncluded: boolean;
  note?: string | null;
  validUntil: string;
  submittedAt?: string | null;
  respondedAt?: string | null;
}

/** Sipariş listelerinde işi tanıtmaya yetecek kadar alan taşınır. */
export interface OrderJobSummary {
  id: string;
  title: string;
  category: CategoryRef;
  status: JobRequestStatus;
  address: MaskedAddress;
}

/** Satıcıya gösterilen müşteri kartı. Telefon ve e-posta burada yer almaz. */
export interface CustomerSummary {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface Order extends BaseEntity {
  jobRequestId?: string | null;
  offerId?: string | null;
  /** MARKETPLACE | COMMERCE_REQUEST */
  source?: string;
  customerId: string;
  providerProfileId: string;
  status: OrderStatus;
  total: Money;
  commission: Money;
  providerPayout: Money;
  job?: OrderJobSummary;
  provider?: ProviderSummary;
  customer?: CustomerSummary;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  approvedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface ReviewRatings {
  quality: number;
  punctuality: number;
  communication: number;
  valueForMoney: number;
  tidiness: number;
}

export interface Review extends BaseEntity {
  orderId: string;
  customerId: string;
  providerProfileId: string;
  status: ReviewStatus;
  ratings: ReviewRatings;
  /** Alt puanların ortalaması. */
  overallRating: number;
  comment?: string | null;
  photoUrls: string[];
  /** Yorumu yazan müşteri. Ad soyad maskelenerek taşınır. */
  customer?: CustomerSummary;
  reply?: ReviewReply | null;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  body: string;
  createdAt: string;
}

export interface FavoriteProvider extends BaseEntity {
  customerId: string;
  providerProfileId: string;
  provider?: ProviderSummary;
}
