import { z } from 'zod';

/**
 * Uygulama açılışında tüm ortam değişkenleri burada doğrulanır.
 * Eksik veya hatalı bir değer varsa süreç, isteklere cevap vermeye başlamadan sonlanır.
 */

const booleanFromString = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');

const csv = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );

export const envSchema = z
  .object({
    // Genel
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    TZ: z.string().default('UTC'),
    DEFAULT_LOCALE: z.string().default('tr'),
    SUPPORTED_LOCALES: csv('tr,en'),
    DEFAULT_COUNTRY_CODE: z.string().length(2).default('TR'),
    DEFAULT_CURRENCY: z.string().length(3).default('TRY'),

    // API
    API_PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('api/v1'),
    API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CORS_ORIGINS: csv('http://localhost:3001'),

    // Veritabanı
    DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunludur'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).default(0),

    // Kimlik doğrulama
    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET en az 32 karakter olmalıdır'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET en az 32 karakter olmalıdır'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
    PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).default(8),
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    // Rate limit
    THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
    THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),
    AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
    MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

    // Depolama
    STORAGE_DRIVER: z.enum(['minio', 's3', 'local']).default('minio'),
    S3_ENDPOINT: z.string().default('http://localhost:9000'),
    S3_PUBLIC_URL: z.string().default('http://localhost:9000'),
    S3_REGION: z.string().default('eu-central-1'),
    S3_BUCKET: z.string().default('ustapilot'),
    S3_ACCESS_KEY: z.string().default('ustapilot'),
    S3_SECRET_KEY: z.string().default('ustapilot_dev_password'),
    S3_FORCE_PATH_STYLE: booleanFromString.default(true),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
    MAX_JOB_MEDIA_COUNT: z.coerce.number().int().positive().default(10),
    ALLOWED_IMAGE_MIME: csv('image/jpeg,image/png,image/webp,image/heic'),
    ALLOWED_DOCUMENT_MIME: csv('application/pdf,image/jpeg,image/png'),

    // Bildirim
    PUSH_DRIVER: z.enum(['mock', 'firebase']).default('mock'),
    MAIL_DRIVER: z.enum(['mock', 'smtp']).default('mock'),
    SMS_DRIVER: z.enum(['mock', 'netgsm', 'twilio']).default('mock'),
    OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
    OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),

    // Ödeme
    PAYMENT_DRIVER: z.enum(['mock', 'iyzico', 'paytr']).default('mock'),
    PAYMENT_CURRENCY: z.string().length(3).default('TRY'),
    DEFAULT_COMMISSION_BPS: z.coerce.number().int().min(0).max(10000).default(1250),
    DEFAULT_COMMISSION_FIXED_MINOR: z.coerce.number().int().min(0).default(0),

    // Seed
    SEED_DEMO_ACCOUNTS: booleanFromString.default(false),
    DEMO_PASSWORD: z.string().default('Demo1234!'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (env.SEED_DEMO_ACCOUNTS) {
        ctx.addIssue({
          code: 'custom',
          path: ['SEED_DEMO_ACCOUNTS'],
          message: 'Demo hesapları production ortamında etkinleştirilemez.',
        });
      }
      const weakSecret = (value: string) => value.toLowerCase().includes('change_me');
      if (weakSecret(env.JWT_ACCESS_SECRET) || weakSecret(env.JWT_REFRESH_SECRET)) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_ACCESS_SECRET'],
          message: 'Production ortamında varsayılan JWT gizli anahtarları kullanılamaz.',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(kök)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Ortam değişkeni doğrulaması başarısız:\n${details}`);
  }

  return result.data;
}
