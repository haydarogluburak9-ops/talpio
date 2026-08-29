import { CURRENCY_CODES, SUPPORTED_LOCALES } from '@talpio/config';
import { DocumentType } from '@talpio/types';
import { z } from 'zod';

import {
  fullNameSchema,
  geoPointSchema,
  isoDateSchema,
  minorAmountSchema,
  optionalPhoneSchema,
  timeOfDaySchema,
  uuidSchema,
} from './primitives';

export const updateUserProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  phone: optionalPhoneSchema,
  avatarFileId: uuidSchema.nullish(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  // `null` açık tercihi kaldırır ve ülke/dil üzerinden türetmeye döner.
  currency: z.enum(CURRENCY_CODES).nullish(),
  countryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, 'Ülke kodu iki harfli olmalıdır')
    .nullish(),
});

export const updateProviderProfileSchema = z.object({
  businessName: z.string().trim().max(160).nullish(),
  about: z.string().trim().max(2000).nullish(),
  experienceYears: z.number().int().min(0).max(70).nullish(),
  acceptsUrgentJobs: z.boolean().optional(),
  canIssueInvoice: z.boolean().optional(),
});

export const providerServiceSchema = z.object({
  categoryId: uuidSchema,
  subcategoryId: uuidSchema.optional(),
  startingPriceMinor: minorAmountSchema.optional(),
});

export const setProviderServicesSchema = z.object({
  services: z
    .array(providerServiceSchema)
    .min(1, 'En az bir hizmet kategorisi seçmelisiniz')
    .max(20, 'En fazla 20 hizmet kategorisi seçebilirsiniz'),
});

export const setProviderServiceAreasSchema = z.object({
  districtIds: z
    .array(uuidSchema)
    .min(1, 'En az bir hizmet bölgesi seçmelisiniz')
    .max(200, 'Çok fazla bölge seçildi'),
});

export const providerAvailabilitySlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeOfDaySchema,
    endTime: timeOfDaySchema,
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.startTime < value.endTime, {
    path: ['endTime'],
    message: 'Bitiş saati başlangıç saatinden sonra olmalıdır',
  });

export const setProviderAvailabilitySchema = z.object({
  slots: z.array(providerAvailabilitySlotSchema).max(21, 'Çok fazla zaman aralığı'),
});

export const uploadProviderDocumentSchema = z.object({
  type: z.enum(DocumentType),
  fileId: uuidSchema,
  expiresAt: isoDateSchema.optional(),
});

export const addressSchema = z.object({
  title: z.string().trim().min(2, 'Adres başlığı çok kısa').max(60),
  cityId: uuidSchema,
  districtId: uuidSchema,
  neighborhoodId: uuidSchema.optional(),
  addressLine: z.string().trim().min(5, 'Açık adres çok kısa').max(500),
  location: geoPointSchema.optional(),
  isDefault: z.boolean().default(false),
});

export type UpdateUserProfileInput = z.input<typeof updateUserProfileSchema>;
export type UpdateUserProfilePayload = z.output<typeof updateUserProfileSchema>;

export type UpdateProviderProfileInput = z.input<typeof updateProviderProfileSchema>;
export type UpdateProviderProfilePayload = z.output<typeof updateProviderProfileSchema>;

export type SetProviderServicesInput = z.input<typeof setProviderServicesSchema>;
export type SetProviderServicesPayload = z.output<typeof setProviderServicesSchema>;

export type AddressInput = z.input<typeof addressSchema>;
