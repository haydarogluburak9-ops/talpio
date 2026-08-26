import type {
  EntityRef,
  ProviderProfile,
  ProviderService,
  ProviderSummary,
} from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { VerificationStatus } from '@/generated/prisma/client';

/** Satıcı profili sorgularında daima çekilen ilişkiler. */
export const providerInclude = {
  user: { select: { fullName: true, avatar: { select: { storageKey: true } } } },
  services: {
    select: {
      id: true,
      providerProfileId: true,
      categoryId: true,
      subcategoryId: true,
      startingPriceMinor: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true } },
      subcategory: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  serviceAreas: {
    select: { district: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProviderProfileInclude;

export type ProviderRow = Prisma.ProviderProfileGetPayload<{ include: typeof providerInclude }>;

export function toProviderProfile(row: ProviderRow): ProviderProfile {
  return {
    id: row.id,
    userId: row.userId,
    businessName: row.businessName,
    about: row.about,
    experienceYears: row.experienceYears,
    verificationStatus: row.verificationStatus,
    isVerified: row.verificationStatus === VerificationStatus.VERIFIED,
    isPremium: row.isPremium,
    acceptsUrgentJobs: row.acceptsUrgentJobs,
    canIssueInvoice: row.canIssueInvoice,
    averageRating: row.averageRating === null ? null : Number(row.averageRating),
    reviewCount: row.reviewCount,
    completedJobCount: row.completedJobCount,
    cancellationRate: cancellationRate(row),
    averageResponseMinutes: row.averageResponseMinutes,
    categories: toCategoryRefs(row),
    serviceAreas: row.serviceAreas.map((area) => ({
      id: area.district.id,
      name: area.district.name,
    })),
    lastActiveAt: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Müşteriye gösterilen özet; istatistik ve rozetler dışındaki alanlar gizlidir. */
export function toProviderSummary(row: ProviderRow, fileBaseUrl: string): ProviderSummary {
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
    categories: toCategoryRefs(row),
  };
}

export function toProviderService(row: ProviderRow['services'][number]): ProviderService {
  return {
    id: row.id,
    providerProfileId: row.providerProfileId,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    startingPriceMinor: row.startingPriceMinor,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Aynı kategoride birden çok alt hizmet tanımlanabildiği için tekilleştirilir. */
function toCategoryRefs(row: ProviderRow): EntityRef[] {
  const categories = new Map(
    row.services.map((service) => [service.category.id, service.category.name]),
  );

  return [...categories].map(([id, name]) => ({ id, name }));
}

/**
 * İptal oranı tamamlanan ve iptal edilen iş sayısından türetilir; hiç iş
 * yapmamış satıcıda oran 0 kabul edilir, aksi halde sıfıra bölünürdü.
 */
function cancellationRate(row: ProviderRow): number {
  const total = row.completedJobCount + row.cancelledJobCount;
  return total === 0 ? 0 : row.cancelledJobCount / total;
}
