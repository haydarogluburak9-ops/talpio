import { UPLOAD } from '@talpio/config';
import { ContentReportTarget, PostType } from '@talpio/types';
import { z } from 'zod';

import { usernameSchema, uuidSchema } from './primitives';

const dealMetadataSchema = z.object({
  productName: z.string().trim().max(160).optional().nullable(),
  title: z.string().trim().max(160).optional().nullable(),
  listPriceMinor: z.number().int().nonnegative().optional().nullable(),
  dealPriceMinor: z.number().int().nonnegative().optional().nullable(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  currency: z.string().trim().length(3).optional(),
  unit: z.string().trim().max(32).optional().nullable(),
  minQuantity: z.string().trim().max(64).optional().nullable(),
  stockQuantity: z.string().trim().max(64).optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  vatIncluded: z.boolean().optional().nullable(),
  shippingIncluded: z.boolean().optional().nullable(),
  locationText: z.string().trim().max(200).optional().nullable(),
  categoryId: uuidSchema.optional().nullable(),
  subcategoryId: uuidSchema.optional().nullable(),
  brand: z.string().trim().max(120).optional().nullable(),
});

const priceRequiredTypes = new Set<string>([
  PostType.DEAL,
  PostType.SPECIAL_PRICE,
  PostType.DISCOUNT,
]);

export const createPostSchema = z
  .object({
    type: z.enum(PostType).default(PostType.TEXT),
    businessId: uuidSchema.optional(),
    body: z.string().trim().max(4000, 'Gönderi metni çok uzun').optional(),
    mediaFileIds: z
      .array(uuidSchema)
      .max(UPLOAD.maxPostMedia, `En fazla ${UPLOAD.maxPostMedia} medya ekleyebilirsiniz`)
      .default([]),
    commerceRequestId: uuidSchema.optional(),
    promoLabel: z.string().trim().max(120).optional(),
    originalPriceMinor: z.number().int().nonnegative().optional(),
    promoPriceMinor: z.number().int().nonnegative().optional(),
    promoCurrency: z.string().trim().length(3).optional(),
    promoValidUntil: z.string().datetime().optional(),
    deal: dealMetadataSchema.optional(),
    originalPostId: uuidSchema.optional(),
  })
  .refine(
    (value) =>
      (value.body !== undefined && value.body.length > 0) ||
      value.mediaFileIds.length > 0 ||
      Boolean(value.originalPostId),
    {
      path: ['body'],
      message: 'Boş gönderi paylaşılamaz',
    },
  )
  .refine(
    (value) =>
      value.promoPriceMinor === undefined ||
      value.originalPriceMinor === undefined ||
      value.promoPriceMinor <= value.originalPriceMinor,
    {
      path: ['promoPriceMinor'],
      message: 'Özel fiyat eski fiyattan yüksek olamaz',
    },
  )
  .refine(
    (value) => {
      if (!value.type || !priceRequiredTypes.has(value.type)) return true;
      const deal = value.deal;
      return Boolean(
        deal?.dealPriceMinor != null ||
          deal?.listPriceMinor != null ||
          deal?.productName?.trim() ||
          deal?.title?.trim() ||
          value.promoPriceMinor != null ||
          value.originalPriceMinor != null ||
          value.promoLabel?.trim(),
      );
    },
    {
      path: ['deal'],
      message: 'Fırsat gönderisi için fiyat veya ürün/başlık gerekli',
    },
  );

export type CreatePostInput = z.input<typeof createPostSchema>;

export const updateSocialProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(500).optional().nullable(),
  username: usernameSchema.optional(),
  locationCityId: uuidSchema.optional().nullable(),
  locationText: z.string().trim().max(120).optional().nullable(),
  avatarFileId: uuidSchema.optional().nullable(),
  coverFileId: uuidSchema.optional().nullable(),
});

export type UpdateSocialProfileInput = z.input<typeof updateSocialProfileSchema>;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Yorum boş olamaz').max(2000, 'Yorum çok uzun'),
  parentId: uuidSchema.optional(),
});

export type CreateCommentInput = z.input<typeof createCommentSchema>;

export const createContentReportSchema = z.object({
  targetType: z.enum(ContentReportTarget),
  targetId: uuidSchema,
  reason: z.string().trim().min(3).max(500),
});

export type CreateContentReportInput = z.input<typeof createContentReportSchema>;
