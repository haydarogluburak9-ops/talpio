import { MESSAGE, REVIEW, UPLOAD } from '@talpio/config';
import { MessageType } from '@talpio/types';
import { z } from 'zod';

import { geoPointSchema, uuidSchema } from './primitives';

const ratingSchema = z
  .number()
  .int('Puan tam sayı olmalıdır')
  .min(REVIEW.minRating, `Puan en az ${REVIEW.minRating} olmalıdır`)
  .max(REVIEW.maxRating, `Puan en fazla ${REVIEW.maxRating} olabilir`);

export const createReviewSchema = z.object({
  orderId: uuidSchema,
  ratings: z.object({
    quality: ratingSchema,
    punctuality: ratingSchema,
    communication: ratingSchema,
    valueForMoney: ratingSchema,
    tidiness: ratingSchema,
  }),
  comment: z.string().trim().max(REVIEW.maxCommentLength, 'Yorum çok uzun').optional(),
  photoFileIds: z
    .array(uuidSchema)
    .max(UPLOAD.maxReviewPhotos, `En fazla ${UPLOAD.maxReviewPhotos} fotoğraf ekleyebilirsiniz`)
    .default([]),
});

export type CreateReviewInput = z.input<typeof createReviewSchema>;

export const replyToReviewSchema = z.object({
  body: z
    .string()
    .trim()
    .min(2, 'Cevap çok kısa')
    .max(REVIEW.maxReplyLength, 'Cevap çok uzun'),
});

export const sendMessageSchema = z
  .object({
    type: z.enum(MessageType).default(MessageType.TEXT),
    body: z.string().trim().max(MESSAGE.maxBodyLength, 'Mesaj çok uzun').optional(),
    attachmentFileIds: z.array(uuidSchema).max(5).default([]),
    location: geoPointSchema.optional(),
    /** Aynı mesajın çift gönderilmesini önler. */
    clientMessageId: z.string().trim().min(8).max(64),
  })
  .refine(
    (value) =>
      value.body !== undefined ||
      value.attachmentFileIds.length > 0 ||
      value.location !== undefined,
    { path: ['body'], message: 'Boş mesaj gönderilemez' },
  );

export const createComplaintSchema = z.object({
  subjectType: z.enum(['USER', 'JOB_REQUEST', 'OFFER', 'REVIEW', 'MESSAGE']),
  subjectId: uuidSchema,
  reason: z.string().trim().min(3, 'Şikâyet nedeni zorunludur').max(120),
  description: z.string().trim().max(2000).optional(),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(5, 'Konu çok kısa').max(160),
  body: z.string().trim().min(10, 'Açıklama çok kısa').max(4000),
  orderId: uuidSchema.optional(),
  attachmentFileIds: z.array(uuidSchema).max(5).default([]),
});

export const supportTicketReplySchema = z.object({
  body: z.string().trim().min(1).max(4000),
  attachmentFileIds: z.array(uuidSchema).max(5).default([]),
});
