import type { Prisma } from '@/generated/prisma/client';
import { VerificationStatus } from '@/generated/prisma/client';
import type { Offer, ProviderSummary } from '@ustapilot/types';

/**
 * Teklif sorgularında daima çekilen ilişkiler. Tek yerde tutulur ki liste ve
 * detay uçları aynı gövdeyi döndürsün.
 */
export const offerInclude = {
  providerProfile: {
    select: {
      id: true,
      businessName: true,
      verificationStatus: true,
      isPremium: true,
      averageRating: true,
      reviewCount: true,
      completedJobCount: true,
      averageResponseMinutes: true,
      user: {
        select: { fullName: true, avatar: { select: { storageKey: true } } },
      },
      services: { select: { category: { select: { id: true, name: true } } } },
    },
  },
} satisfies Prisma.OfferInclude;

export type OfferRow = Prisma.OfferGetPayload<{ include: typeof offerInclude }>;

export function toOffer(row: OfferRow, options: { fileBaseUrl: string }): Offer {
  return {
    id: row.id,
    jobRequestId: row.jobRequestId,
    providerProfileId: row.providerProfileId,
    provider: toProviderSummary(row.providerProfile, options.fileBaseUrl),
    status: row.status,
    price: { amountMinor: row.amountMinor, currency: row.currency },
    priceType: row.priceType,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
    availableFrom: row.availableFrom?.toISOString() ?? null,
    materialsIncluded: row.materialsIncluded,
    note: row.note,
    validUntil: row.validUntil.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toProviderSummary(row: OfferRow['providerProfile'], fileBaseUrl: string): ProviderSummary {
  // Aynı kategoriye birden çok hizmet tanımlanabildiği için tekilleştirilir.
  const categories = new Map(
    row.services.map((service) => [service.category.id, service.category.name]),
  );

  const avatarKey = row.user.avatar?.storageKey;

  return {
    id: row.id,
    displayName: row.businessName ?? row.user.fullName,
    avatarUrl: avatarKey ? `${fileBaseUrl}/${avatarKey}` : null,
    isVerified: row.verificationStatus === VerificationStatus.VERIFIED,
    isPremium: row.isPremium,
    averageRating: row.averageRating === null ? null : Number(row.averageRating),
    reviewCount: row.reviewCount,
    completedJobCount: row.completedJobCount,
    averageResponseMinutes: row.averageResponseMinutes,
    categories: [...categories].map(([id, name]) => ({ id, name })),
  };
}
