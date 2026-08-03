import { JOB, UPLOAD } from '@ustapilot/config';
import { JobSize, JobTimeSlot } from '@ustapilot/types';
import { z } from 'zod';

import { geoPointSchema, isoDateSchema, minorAmountSchema, uuidSchema } from './primitives';

export const jobAddressSchema = z.object({
  cityId: uuidSchema,
  districtId: uuidSchema,
  neighborhoodId: uuidSchema.optional(),
  addressLine: z.string().trim().min(5, 'Açık adres çok kısa').max(500).optional(),
  location: geoPointSchema.optional(),
});

const jobCoreSchema = z.object({
  categoryId: uuidSchema,
  subcategoryId: uuidSchema.optional(),
  isUrgent: z.boolean().default(false),
  title: z
    .string()
    .trim()
    .min(JOB.minTitleLength, `Başlık en az ${JOB.minTitleLength} karakter olmalıdır`)
    .max(JOB.maxTitleLength, 'Başlık çok uzun'),
  description: z
    .string()
    .trim()
    .min(JOB.minDescriptionLength, `Açıklama en az ${JOB.minDescriptionLength} karakter olmalıdır`)
    .max(JOB.maxDescriptionLength, 'Açıklama çok uzun'),
  problemStartedAt: isoDateSchema.optional(),
  size: z.enum(JobSize).default(JobSize.UNKNOWN),
  materialsIncluded: z.boolean().optional(),
  inspectionRequired: z.boolean().default(false),
  /** Bütçe zorunlu değildir; girilirse kuruş cinsinden pozitif olmalıdır. */
  budgetMinor: minorAmountSchema.positive('Bütçe sıfırdan büyük olmalıdır').optional(),
  attachmentFileIds: z
    .array(uuidSchema)
    .max(UPLOAD.maxJobAttachments, `En fazla ${UPLOAD.maxJobAttachments} dosya yükleyebilirsiniz`)
    .default([]),
  address: jobAddressSchema,
  preferredDate: isoDateSchema.optional(),
  preferredTimeSlot: z.enum(JobTimeSlot).default(JobTimeSlot.FLEXIBLE),
});

export const createJobRequestSchema = jobCoreSchema.refine(
  (value) => value.preferredTimeSlot === JobTimeSlot.FLEXIBLE || value.preferredDate !== undefined,
  {
    path: ['preferredDate'],
    message: 'Belirli bir zaman dilimi seçtiyseniz tarih de seçmelisiniz',
  },
);

export type CreateJobRequestInput = z.input<typeof createJobRequestSchema>;
export type CreateJobRequestPayload = z.output<typeof createJobRequestSchema>;

export const updateJobRequestSchema = jobCoreSchema.partial();

/** Talep oluşturma sihirbazının adım adım doğrulaması. */
export const jobWizardStepSchemas = {
  category: jobCoreSchema.pick({ categoryId: true, subcategoryId: true, isUrgent: true }),
  details: jobCoreSchema.pick({
    title: true,
    description: true,
    problemStartedAt: true,
    size: true,
    materialsIncluded: true,
    inspectionRequired: true,
    budgetMinor: true,
  }),
  media: jobCoreSchema.pick({ attachmentFileIds: true }),
  location: jobCoreSchema.pick({ address: true }),
  schedule: jobCoreSchema.pick({ preferredDate: true, preferredTimeSlot: true }),
} as const;

export const jobListQuerySchema = z.object({
  status: z.string().optional(),
  categoryId: uuidSchema.optional(),
  cityId: uuidSchema.optional(),
  districtId: uuidSchema.optional(),
  isUrgent: z.coerce.boolean().optional(),
});

export const jobStatusChangeSchema = z.object({
  status: z.string().min(1),
  note: z.string().trim().max(500).optional(),
  location: geoPointSchema.optional(),
});
