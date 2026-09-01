import { RequestSource, RequestType, RequestVisibility } from '@talpio/types';
import { z } from 'zod';

import { isoDateSchema, minorAmountSchema, uuidSchema } from './primitives';

export const createCommerceRequestSchema = z.object({
  requestType: z.enum(RequestType),
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().min(10).max(5000),
  categoryId: uuidSchema.optional(),
  subcategoryId: uuidSchema.optional(),
  quantity: z.string().trim().min(1).max(32).optional(),
  unit: z.string().trim().min(1).max(32).optional(),
  specifications: z.record(z.string(), z.unknown()).optional(),
  budgetMinor: minorAmountSchema.positive().optional(),
  deliveryCityId: uuidSchema.optional(),
  deliveryDistrictId: uuidSchema.optional(),
  deliveryAddressText: z.string().trim().max(500).optional(),
  deliveryDeadline: isoDateSchema.optional(),
  /** Doğrudan teklif istenen işletme; verilirse talep yalnızca ona gider. */
  businessId: uuidSchema.optional(),
  visibility: z.enum(RequestVisibility).optional(),
  source: z.enum(RequestSource).optional(),
  publish: z.boolean().optional(),
});

export type CreateCommerceRequestPayload = z.infer<typeof createCommerceRequestSchema>;

export const offerLetterheadSchema = z.object({
  legalName: z.string().trim().min(2).max(160).optional(),
  invoiceTitle: z.string().trim().min(2).max(160).optional(),
  taxOffice: z.string().trim().max(80).optional(),
  taxId: z.string().trim().max(32).optional(),
  address: z.string().trim().max(300).optional(),
  phone: z.string().trim().max(32).optional(),
  logoUrl: z.string().trim().max(500).optional(),
});

export const createRequestOfferSchema = z.object({
  businessId: uuidSchema,
  amountMinor: minorAmountSchema.positive(),
  currency: z.string().length(3).optional(),
  deliveryDays: z.number().int().positive().optional(),
  shippingIncluded: z.boolean(),
  locationText: z.string().trim().min(2).max(200),
  note: z.string().trim().max(2000).optional(),
  brand: z.string().trim().min(1).max(80).optional(),
  model: z.string().trim().min(1).max(80).optional(),
  letterhead: offerLetterheadSchema.optional(),
  validUntil: isoDateSchema,
});

export type CreateRequestOfferPayload = z.infer<typeof createRequestOfferSchema>;

export const createSupplierBusinessSchema = z.object({
  name: z.string().trim().min(2).max(120),
  categoryIds: z.array(uuidSchema).min(1),
  districtIds: z.array(uuidSchema).optional(),
  cityId: uuidSchema.optional(),
});

export type CreateSupplierBusinessPayload = z.infer<typeof createSupplierBusinessSchema>;
