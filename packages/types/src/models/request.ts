import type {
  RequestOfferStatus,
  RequestSource,
  RequestStatus,
  RequestType,
  RequestVisibility,
} from '../enums/request';
import type { BaseEntity, Money } from './common';

export interface CommerceRequest extends BaseEntity {
  requestType: RequestType;
  title: string;
  description: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  quantity?: string | null;
  unit?: string | null;
  specifications: Record<string, unknown>;
  budgetMinor?: number | null;
  currency: string;
  deliveryCityId?: string | null;
  deliveryDistrictId?: string | null;
  deliveryAddressText?: string | null;
  deliveryDeadline?: string | null;
  visibility: RequestVisibility;
  buyerUserId: string;
  businessId?: string | null;
  status: RequestStatus;
  source: RequestSource;
  aiClassification?: Record<string, unknown> | null;
  aiConfidence?: string | null;
  publishedAt?: string | null;
  /** listMatched yanıtında doldurulur. */
  matchScore?: number | null;
  matchReasons?: string[] | null;
}

export interface RequestMatch {
  id: string;
  requestId: string;
  businessId: string;
  score: number;
  reasons: Record<string, unknown>;
  notifiedAt?: string | null;
}

export interface RequestOffer extends BaseEntity {
  requestId: string;
  businessId: string;
  createdByUserId: string;
  status: RequestOfferStatus;
  amountMinor: number;
  currency: string;
  deliveryDays?: number | null;
  shippingIncluded?: boolean | null;
  locationText?: string | null;
  note?: string | null;
  validUntil: string;
  submittedAt?: string | null;
  amount?: Money;
  badges?: string[];
}

export interface RequestOrderLink {
  id: string;
  requestOfferId: string;
  orderId: string;
}

/** Adapter çıktısı: JobRequest veya CommerceRequest ortak görünümü. */
export interface RequestView {
  id: string;
  kind: 'commerce_request' | 'job_request';
  title: string;
  description: string;
  status: string;
  categoryId?: string | null;
  buyerUserId: string;
  cityId?: string | null;
  districtId?: string | null;
  budgetMinor?: number | null;
  currency: string;
  publishedAt?: string | null;
  commerceRequestId?: string | null;
  jobRequestId?: string | null;
}
