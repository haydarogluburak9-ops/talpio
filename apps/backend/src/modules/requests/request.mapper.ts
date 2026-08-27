import type { CommerceRequest, RequestOffer } from '@talpio/types';
import type { Prisma } from '@/generated/prisma/client';

export type CommerceRequestRow = Prisma.CommerceRequestGetPayload<{
  include: {
    category: { select: { id: true; slug: true; name: true } };
    matches: true;
  };
}>;

export function toCommerceRequest(row: {
  id: string;
  requestType: string;
  title: string;
  description: string;
  categoryId: string | null;
  subcategoryId: string | null;
  quantity: { toString(): string } | null;
  unit: string | null;
  specifications: unknown;
  budgetMinor: number | null;
  currency: string;
  deliveryCityId: string | null;
  deliveryDistrictId: string | null;
  deliveryAddressText: string | null;
  deliveryDeadline: Date | null;
  visibility: string;
  buyerUserId: string;
  businessId: string | null;
  status: string;
  source: string;
  aiClassification: unknown;
  aiConfidence: { toString(): string } | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  matchScore?: number | null;
  matchReasons?: string[] | null;
  matchCount?: number | null;
  offerCount?: number | null;
  pendingOfferCount?: number | null;
}): CommerceRequest {
  return {
    id: row.id,
    requestType: row.requestType as CommerceRequest['requestType'],
    title: row.title,
    description: row.description,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    quantity: row.quantity?.toString() ?? null,
    unit: row.unit,
    specifications: (row.specifications as Record<string, unknown>) ?? {},
    budgetMinor: row.budgetMinor,
    currency: row.currency,
    deliveryCityId: row.deliveryCityId,
    deliveryDistrictId: row.deliveryDistrictId,
    deliveryAddressText: row.deliveryAddressText,
    deliveryDeadline: row.deliveryDeadline?.toISOString() ?? null,
    visibility: row.visibility as CommerceRequest['visibility'],
    buyerUserId: row.buyerUserId,
    businessId: row.businessId,
    status: row.status as CommerceRequest['status'],
    source: row.source as CommerceRequest['source'],
    aiClassification: (row.aiClassification as Record<string, unknown>) ?? null,
    aiConfidence: row.aiConfidence?.toString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    matchScore: row.matchScore ?? null,
    matchReasons: row.matchReasons ?? null,
    matchCount: row.matchCount ?? null,
    offerCount: row.offerCount ?? null,
    pendingOfferCount: row.pendingOfferCount ?? null,
  };
}

/**
 * Teklif kartında satıcıyı gösterebilmek için gereken alanlar. `businessId`
 * tek başına bir kimlik; alıcıya "kimden geldi" sorusunu cevaplamaz.
 */
export interface RequestOfferSellerRow {
  name: string;
  slug: string | null;
  verificationStatus: string;
  socialProfile: { username: string } | null;
}

export function toRequestOffer(
  row: {
    id: string;
    requestId: string;
    businessId: string;
    createdByUserId: string;
    status: string;
    amountMinor: number;
    currency: string;
    deliveryDays: number | null;
    shippingIncluded: boolean | null;
    locationText: string | null;
    note: string | null;
    validUntil: Date;
    submittedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  },
  seller?: RequestOfferSellerRow | null,
): RequestOffer {
  return {
    ...(seller
      ? {
          seller: {
            businessId: row.businessId,
            name: seller.name,
            slug: seller.slug,
            username: seller.socialProfile?.username ?? null,
            isVerified: seller.verificationStatus === 'VERIFIED',
          },
        }
      : {}),
    id: row.id,
    requestId: row.requestId,
    businessId: row.businessId,
    createdByUserId: row.createdByUserId,
    status: row.status as RequestOffer['status'],
    amountMinor: row.amountMinor,
    currency: row.currency,
    deliveryDays: row.deliveryDays,
    shippingIncluded: row.shippingIncluded,
    locationText: row.locationText,
    note: row.note,
    validUntil: row.validUntil.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    amount: { amountMinor: row.amountMinor, currency: row.currency },
  };
}
