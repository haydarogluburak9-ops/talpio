export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
} as const;

export const UPLOAD = {
  maxImageSizeBytes: 10 * 1024 * 1024,
  maxDocumentSizeBytes: 10 * 1024 * 1024,
  maxJobAttachments: 10,
  maxReviewPhotos: 5,
  allowedImageMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const,
  allowedDocumentMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'] as const,
} as const;

export const JOB = {
  minTitleLength: 8,
  maxTitleLength: 120,
  minDescriptionLength: 20,
  maxDescriptionLength: 4000,
  /** Yayınlanan bir talep bu süre sonunda otomatik kapanır. */
  defaultExpiryDays: 14,
} as const;

export const OFFER = {
  minNoteLength: 0,
  maxNoteLength: 1500,
  /** Teklif geçerlilik süresi için varsayılan ve sınırlar (saat). */
  defaultValidityHours: 72,
  minValidityHours: 6,
  maxValidityHours: 336,
  minAmountMinor: 5000,
  maxAmountMinor: 100_000_000,
} as const;

export const REVIEW = {
  minRating: 1,
  maxRating: 5,
  maxCommentLength: 2000,
  maxReplyLength: 1000,
} as const;

export const MESSAGE = {
  maxBodyLength: 4000,
  /** Gerçek zamanlı bağlantı kurulana kadar kullanılacak yenileme aralığı (ms). */
  pollingIntervalMs: 8000,
} as const;

export const AUTH = {
  minPasswordLength: 8,
  maxPasswordLength: 128,
  otpLength: 6,
  otpTtlMinutes: 5,
  maxLoginAttempts: 5,
  lockoutMinutes: 15,
} as const;

/** Varsayılan komisyon: baz puan cinsinden (1250 = %12,5). */
export const COMMISSION = {
  defaultRateBps: 1250,
  defaultFixedMinor: 0,
  premiumRateBps: 1000,
  maxRateBps: 5000,
} as const;
