import { AUTH, PAGINATION } from '@ustapilot/config';
import { z } from 'zod';

export const uuidSchema = z.uuid({ message: 'Geçersiz kimlik' });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'E-posta zorunludur')
  .max(254, 'E-posta çok uzun')
  .pipe(z.email({ message: 'Geçerli bir e-posta adresi giriniz' }));

/**
 * E.164 biçiminde telefon numarası. İstemciler ülke kodunu kendi seçtikleri
 * arayüzle birleştirip buraya normalize edilmiş değer gönderir.
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, 'Telefon numarasını ülke kodu ile giriniz');

/**
 * İsteğe bağlı telefon alanı. Form denetimleri boş bırakıldığında `undefined`
 * değil `""` gönderir; boş dize "girilmedi" sayılmazsa alan zorunlu davranır.
 */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' ? undefined : value))
  .pipe(phoneSchema.optional());

export const passwordSchema = z
  .string()
  .min(AUTH.minPasswordLength, `Şifre en az ${AUTH.minPasswordLength} karakter olmalıdır`)
  .max(AUTH.maxPasswordLength, 'Şifre çok uzun')
  .regex(/[a-zçğıöşü]/, 'Şifre en az bir küçük harf içermelidir')
  .regex(/[A-ZÇĞİÖŞÜ]/, 'Şifre en az bir büyük harf içermelidir')
  .regex(/\d/, 'Şifre en az bir rakam içermelidir');

export const otpSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${AUTH.otpLength}}$`), `Doğrulama kodu ${AUTH.otpLength} haneli olmalıdır`);

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Ad soyad en az 2 karakter olmalıdır')
  .max(120, 'Ad soyad çok uzun');

/** Kuruş cinsinden pozitif tam sayı. Kayan noktalı tutar kabul edilmez. */
export const minorAmountSchema = z
  .number()
  .int('Tutar kuruş cinsinden tam sayı olmalıdır')
  .nonnegative('Tutar negatif olamaz');

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const geoPointSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
});

/** "HH:mm" biçiminde yerel saat. */
export const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Saat HH:mm biçiminde olmalıdır');

export const isoDateSchema = z.iso.datetime({ message: 'Geçersiz tarih' });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  limit: z.coerce.number().int().min(1).max(PAGINATION.maxLimit).default(PAGINATION.defaultLimit),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z
    .string()
    .regex(/^-?[a-zA-Z][a-zA-Z0-9_.]*$/, 'Sıralama alanı geçersiz')
    .optional(),
});

export type PaginationQueryInput = z.input<typeof paginationQuerySchema>;
export type PaginationQueryOutput = z.output<typeof paginationQuerySchema>;
