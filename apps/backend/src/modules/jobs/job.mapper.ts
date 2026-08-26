import type { Prisma } from '@/generated/prisma/client';
import type { JobAttachment, JobRequest, MaskedAddress } from '@talpio/types';

/**
 * Talep sorgularında daima çekilen ilişkiler. Tek yerde tutulur ki liste ve
 * detay uçları aynı gövdeyi döndürsün.
 */
export const jobRequestInclude = {
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  city: { select: { name: true } },
  district: { select: { name: true } },
  neighborhood: { select: { name: true } },
  address: { select: { addressLine: true } },
  attachments: {
    orderBy: { sortOrder: 'asc' },
    include: {
      file: {
        select: { id: true, storageKey: true, mimeType: true, sizeBytes: true, isPublic: true },
      },
    },
  },
} satisfies Prisma.JobRequestInclude;

export type JobRequestRow = Prisma.JobRequestGetPayload<{ include: typeof jobRequestInclude }>;

/**
 * Talebi API gövdesine çevirir.
 *
 * `revealAddress` yalnızca müşterinin kendisi ve işi üstlenen satıcı için doğrudur.
 * Havuzdaki satıcılar açık adresi ve koordinatı göremez; ilçe seviyesi yeterlidir
 * ve müşterinin mahremiyeti korunur.
 */
export function toJobRequest(
  row: JobRequestRow,
  options: { revealAddress: boolean; fileBaseUrl: string },
): JobRequest {
  return {
    id: row.id,
    customerId: row.customerId,
    category: { id: row.category.id, name: row.category.name },
    subcategory: row.subcategory ? { id: row.subcategory.id, name: row.subcategory.name } : null,
    title: row.title,
    description: row.description,
    status: row.status,
    isUrgent: row.isUrgent,
    size: row.size,
    materialsIncluded: row.materialsIncluded,
    inspectionRequired: row.inspectionRequired,
    budget:
      row.budgetMinor === null ? null : { amountMinor: row.budgetMinor, currency: row.currency },
    problemStartedAt: row.problemStartedAt?.toISOString() ?? null,
    preferredDate: row.preferredDate?.toISOString() ?? null,
    preferredTimeSlot: row.preferredTimeSlot,
    address: toMaskedAddress(row, options.revealAddress),
    attachments: row.attachments.map((item) => toAttachment(item, options.fileBaseUrl)),
    offerCount: row.offerCount,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMaskedAddress(row: JobRequestRow, reveal: boolean): MaskedAddress {
  const base: MaskedAddress = {
    cityName: row.city.name,
    districtName: row.district.name,
    neighborhoodName: row.neighborhood?.name ?? null,
    isFullyVisible: reveal,
  };

  if (!reveal) return base;

  return {
    ...base,
    addressLine: row.address?.addressLine ?? null,
    location:
      row.latitude === null || row.longitude === null
        ? null
        : { latitude: Number(row.latitude), longitude: Number(row.longitude) },
  };
}

function toAttachment(
  row: JobRequestRow['attachments'][number],
  fileBaseUrl: string,
): JobAttachment {
  return {
    id: row.id,
    fileId: row.fileId,
    url: `${fileBaseUrl}/${row.file.storageKey}`,
    mimeType: row.file.mimeType,
    sizeBytes: row.file.sizeBytes,
    sortOrder: row.sortOrder,
  };
}
