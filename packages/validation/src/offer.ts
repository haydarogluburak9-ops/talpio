import { OFFER } from '@talpio/config';
import { OfferPriceType } from '@talpio/types';
import { z } from 'zod';

import { isoDateSchema, minorAmountSchema, uuidSchema } from './primitives';

export const createOfferSchema = z
  .object({
    jobRequestId: uuidSchema,
    priceType: z.enum(OfferPriceType),
    amountMinor: minorAmountSchema
      .min(OFFER.minAmountMinor, 'Teklif tutarı çok düşük')
      .max(OFFER.maxAmountMinor, 'Teklif tutarı çok yüksek'),
    estimatedDurationMinutes: z
      .number()
      .int()
      .min(15, 'Tahmini süre en az 15 dakika olmalıdır')
      .max(60 * 24 * 30, 'Tahmini süre çok uzun')
      .optional(),
    availableFrom: isoDateSchema.optional(),
    materialsIncluded: z.boolean().default(false),
    note: z.string().trim().max(OFFER.maxNoteLength, 'Açıklama çok uzun').optional(),
    validityHours: z
      .number()
      .int()
      .min(OFFER.minValidityHours, `Geçerlilik süresi en az ${OFFER.minValidityHours} saat olmalıdır`)
      .max(OFFER.maxValidityHours, 'Geçerlilik süresi çok uzun')
      .default(OFFER.defaultValidityHours),
  })
  .refine(
    (value) =>
      value.priceType !== OfferPriceType.AFTER_INSPECTION || value.note !== undefined,
    {
      path: ['note'],
      message: 'Keşif sonrası fiyat için açıklama zorunludur',
    },
  );

export type CreateOfferInput = z.input<typeof createOfferSchema>;
export type CreateOfferPayload = z.output<typeof createOfferSchema>;

export const updateOfferSchema = z.object({
  amountMinor: minorAmountSchema.min(OFFER.minAmountMinor).max(OFFER.maxAmountMinor).optional(),
  priceType: z.enum(OfferPriceType).optional(),
  estimatedDurationMinutes: z.number().int().min(15).max(60 * 24 * 30).optional(),
  availableFrom: isoDateSchema.optional(),
  materialsIncluded: z.boolean().optional(),
  note: z.string().trim().max(OFFER.maxNoteLength).optional(),
  validityHours: z.number().int().min(OFFER.minValidityHours).max(OFFER.maxValidityHours).optional(),
});

export const acceptOfferSchema = z.object({
  /** Aynı teklifin iki kez kabul edilmesini önler. */
  idempotencyKey: z.string().trim().min(8).max(128),
  scheduledAt: isoDateSchema.optional(),
});

export const rejectOfferSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
