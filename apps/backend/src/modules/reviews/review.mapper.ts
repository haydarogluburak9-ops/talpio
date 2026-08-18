import type { Prisma } from '@/generated/prisma/client';
import type { CustomerSummary, Review, ReviewReply } from '@talpio/types';

/**
 * Değerlendirme sorgularında daima çekilen ilişkiler. Liste ve detay uçları
 * aynı gövdeyi döndürsün diye tek yerde tutulur.
 */
export const reviewInclude = {
  customer: { select: { id: true, fullName: true, avatar: { select: { storageKey: true } } } },
  reply: true,
} satisfies Prisma.ReviewInclude;

export type ReviewRow = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;

export interface ReviewMapperOptions {
  fileBaseUrl: string;
  /** Fotoğraf kimliği → depo anahtarı. Kaydı silinmiş dosyalar haritada yer almaz. */
  storageKeys: Map<string, string>;
}

export function toReview(row: ReviewRow, options: ReviewMapperOptions): Review {
  return {
    id: row.id,
    orderId: row.orderId,
    customerId: row.customerId,
    providerProfileId: row.providerProfileId,
    status: row.status,
    ratings: {
      quality: row.ratingQuality,
      punctuality: row.ratingPunctuality,
      communication: row.ratingCommunication,
      valueForMoney: row.ratingValue,
      tidiness: row.ratingTidiness,
    },
    overallRating: Number(row.overallRating),
    comment: row.comment,
    photoUrls: toPhotoUrls(row.photoFileIds, options),
    customer: toCustomerSummary(row.customer, options.fileBaseUrl),
    reply: row.reply ? toReply(row.reply) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Yorum fotoğrafları dosya kimliği olarak saklanır; ilişki tablosu yoktur.
 * Depo anahtarları toplu sorguyla çözüldüğü için haritadan okunur, çözülemeyen
 * kimlik listeden düşer: kırık bir bağlantı basmak boş bırakmaktan kötüdür.
 */
function toPhotoUrls(fileIds: string[], options: ReviewMapperOptions): string[] {
  return fileIds
    .map((fileId) => options.storageKeys.get(fileId))
    .filter((key): key is string => key !== undefined)
    .map((key) => `${options.fileBaseUrl}/${key}`);
}

/**
 * Yorumlar satıcı profilinde herkese açık görüldüğü için müşterinin soyadı
 * baş harfe indirilir; e-posta ve telefon hiçbir sunumda taşınmaz.
 */
function toCustomerSummary(row: ReviewRow['customer'], fileBaseUrl: string): CustomerSummary {
  const avatarKey = row.avatar?.storageKey;

  return {
    id: row.id,
    displayName: maskFullName(row.fullName),
    avatarUrl: avatarKey ? `${fileBaseUrl}/${avatarKey}` : null,
  };
}

export function maskFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return fullName.trim();

  const last = parts[parts.length - 1] ?? '';
  return [...parts.slice(0, -1), `${last.slice(0, 1).toLocaleUpperCase('tr-TR')}.`].join(' ');
}

function toReply(row: NonNullable<ReviewRow['reply']>): ReviewReply {
  return {
    id: row.id,
    reviewId: row.reviewId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}
