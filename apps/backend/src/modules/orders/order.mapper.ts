import type { Prisma } from '@/generated/prisma/client';
import { VerificationStatus } from '@/generated/prisma/client';
import type {
  CustomerSummary,
  MaskedAddress,
  Order,
  OrderJobSummary,
  ProviderSummary,
} from '@ustapilot/types';

/**
 * Sipariş sorgularında daima çekilen ilişkiler. Liste ve detay uçları aynı
 * gövdeyi döndürsün diye tek yerde tutulur.
 */
export const orderInclude = {
  jobRequest: {
    select: {
      id: true,
      title: true,
      status: true,
      customerId: true,
      category: { select: { id: true, name: true } },
      city: { select: { name: true } },
      district: { select: { name: true } },
      neighborhood: { select: { name: true } },
      address: { select: { addressLine: true } },
      latitude: true,
      longitude: true,
    },
  },
  providerProfile: {
    select: {
      id: true,
      userId: true,
      businessName: true,
      verificationStatus: true,
      isPremium: true,
      averageRating: true,
      reviewCount: true,
      completedJobCount: true,
      averageResponseMinutes: true,
      user: { select: { fullName: true, avatar: { select: { storageKey: true } } } },
      services: { select: { category: { select: { id: true, name: true } } } },
    },
  },
  customer: { select: { id: true, fullName: true, avatar: { select: { storageKey: true } } } },
} satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/**
 * Siparişi API gövdesine çevirir.
 *
 * Açık adres yalnızca müşteri ile işi üstlenen ustaya gösterilir; sipariş
 * aşamasında usta zaten seçilmiştir, dolayısıyla `revealAddress` çağıran
 * tarafın kimliğine göre belirlenir.
 */
export function toOrder(
  row: OrderRow,
  options: { revealAddress: boolean; fileBaseUrl: string },
): Order {
  return {
    id: row.id,
    jobRequestId: row.jobRequestId,
    offerId: row.offerId,
    customerId: row.customerId,
    providerProfileId: row.providerProfileId,
    status: row.status,
    total: { amountMinor: row.totalMinor, currency: row.currency },
    commission: { amountMinor: row.commissionMinor, currency: row.currency },
    providerPayout: { amountMinor: row.payoutMinor, currency: row.currency },
    job: toJobSummary(row, options.revealAddress),
    provider: toProviderSummary(row.providerProfile, options.fileBaseUrl),
    customer: toCustomerSummary(row.customer, options.fileBaseUrl),
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toJobSummary(row: OrderRow, reveal: boolean): OrderJobSummary {
  const job = row.jobRequest;

  const address: MaskedAddress = {
    cityName: job.city.name,
    districtName: job.district.name,
    neighborhoodName: job.neighborhood?.name ?? null,
    isFullyVisible: reveal,
    ...(reveal
      ? {
          addressLine: job.address?.addressLine ?? null,
          location:
            job.latitude === null || job.longitude === null
              ? null
              : { latitude: Number(job.latitude), longitude: Number(job.longitude) },
        }
      : {}),
  };

  return {
    id: job.id,
    title: job.title,
    category: { id: job.category.id, name: job.category.name },
    status: job.status,
    address,
  };
}

function toProviderSummary(row: OrderRow['providerProfile'], fileBaseUrl: string): ProviderSummary {
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

function toCustomerSummary(row: OrderRow['customer'], fileBaseUrl: string): CustomerSummary {
  const avatarKey = row.avatar?.storageKey;

  return {
    id: row.id,
    displayName: row.fullName,
    avatarUrl: avatarKey ? `${fileBaseUrl}/${avatarKey}` : null,
  };
}
