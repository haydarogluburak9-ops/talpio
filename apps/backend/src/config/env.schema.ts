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
    DEFAULT_LOCALE: z.string().default('en'),
    SUPPORTED_LOCALES: csv('en,tr,de,es,fr,ar'),
    DEFAULT_COUNTRY_CODE: z.string().length(2).default('TR'),
    // Yalnızca kullanıcının ülkesi, işletme ayarı ve dili çözülemediğinde
    // kullanılan son çare. Tek bir ülkenin parası olmaması bilinçli.
    DEFAULT_CURRENCY: z.string().length(3).default('USD'),

    // API
    API_PORT: z.coerce.number().int().positive().default(3000),
    API_PREFIX: z.string().default('api/v1'),
    API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
    WEB_APP_URL: z.string().url().default('http://localhost:3002'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    CORS_ORIGINS: csv('http://localhost:3001'),

    // Veritabanı
    DATABASE_URL: z.string().min(1, 'DATABASE_URL zorunludur'),
    /** Okuma replikası; yoksa birincil URL kullanılır. */
    DATABASE_READ_URL: z
      .string()
      .optional()
      .transform((value) => (value && value.trim().length > 0 ? value : undefined)),

    // CDN / medya dağıtımı
    /** CloudFront veya Cloudflare kök URL (sonunda / yok). Boşsa S3_PUBLIC_URL/bucket kullanılır. */
    CDN_PUBLIC_URL: z
      .string()
      .optional()
      .transform((value) => (value && value.trim().length > 0 ? value : undefined))
      .pipe(z.string().url().optional()),

    // Sosyal önbellek ve bakım
    FEED_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(600).default(45),
    STORY_TTL_HOURS: z.coerce.number().int().min(12).max(72).default(24),
    SOCIAL_MAINTENANCE_INTERVAL_MS: z.coerce.number().int().positive().default(3_600_000),
    /** Lansman öncesi demo hikâyeleri otomatik yeniler; lansman sonrası false yapın. */
    DEMO_STORY_REFRESH_ENABLED: booleanFromString.default(true),
    /** Demo hikâye yenileme aralığı (ms). Varsayılan 12 saat. */
    DEMO_STORY_REFRESH_INTERVAL_MS: z.coerce.number().int().positive().default(43_200_000),
    REALTIME_ENABLED: booleanFromString.default(true),
    /** Video küçük resmi için ffmpeg yolu; yoksa yalnızca görsel sıkıştırma yapılır. */
    FFMPEG_PATH: z.string().optional(),

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
    S3_BUCKET: z.string().default('talpio'),
    S3_ACCESS_KEY: z.string().default('talpio'),
    S3_SECRET_KEY: z.string().default('talpio_dev_password'),
    S3_FORCE_PATH_STYLE: booleanFromString.default(true),
    MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
    MAX_JOB_MEDIA_COUNT: z.coerce.number().int().positive().default(10),
    ALLOWED_IMAGE_MIME: csv('image/jpeg,image/png,image/webp,image/heic'),
    ALLOWED_DOCUMENT_MIME: csv('application/pdf,image/jpeg,image/png'),

    // Bildirim
    PUSH_DRIVER: z.enum(['mock', 'expo']).default('mock'),
    MAIL_DRIVER: z.enum(['mock', 'smtp', 'resend']).default('mock'),
    SMS_DRIVER: z.enum(['mock', 'netgsm', 'twilio']).default('mock'),
    MAIL_FROM: z.string().default('Talpio <no-reply@talpio.com>'),
    SMS_SENDER: z.string().default('TALPIO'),
    /**
     * Expo Push API isteğe bağlı erişim jetonu. Expo hesabında "enhanced push
     * security" açıksa zorunlu olur; açık değilse boş bırakılabilir.
     */
    EXPO_ACCESS_TOKEN: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: booleanFromString.default(false),
    /** Resend API anahtarı; `MAIL_DRIVER=resend` seçildiğinde zorunludur. */
    RESEND_API_KEY: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_FROM: z.string().optional(),
    NETGSM_USER: z.string().optional(),
    NETGSM_PASS: z.string().optional(),
    NETGSM_HEADER: z.string().optional(),
    IYZICO_API_KEY: z.string().optional(),
    IYZICO_SECRET_KEY: z.string().optional(),
    IYZICO_BASE_URL: z.string().url().default('https://sandbox-api.iyzipay.com'),
    /** Mock sürücülerin bellekte tuttuğu son gönderim sayısı. */
    NOTIFICATION_OUTBOX_LIMIT: z.coerce.number().int().positive().max(1000).default(200),
    OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
    OTP_TTL_MINUTES: z.coerce.number().int().positive().default(5),

    // Ödeme
    /**
     * `disabled`, platform üzerinden tahsilat yapılmayan sürümler içindir ve
     * her ödeme denemesini açıkça reddeder. `mock` ise denemeyi başarılı sayar;
     * bu yüzden yalnızca geliştirme ortamında kullanılabilir.
     */
    PAYMENT_DRIVER: z.enum(['mock', 'disabled', 'iyzico', 'paytr']).default('mock'),
    /**
     * Ödeme sağlayıcısının mutabakat para birimi; ilan fiyatlarıyla ilgisi yok.
     * iyzico yalnızca lira ile çalıştığı için varsayılan TRY kaldı.
     */
    PAYMENT_CURRENCY: z.string().length(3).default('TRY'),
    /** Sağlayıcı webhook'larının imzasını doğrulayan paylaşılan gizli anahtar. */
    PAYMENT_WEBHOOK_SECRET: z.string().min(16).default('change_me_payment_webhook_secret'),
    DEFAULT_COMMISSION_BPS: z.coerce.number().int().min(0).max(10000).default(1250),
    DEFAULT_COMMISSION_FIXED_MINOR: z.coerce.number().int().min(0).default(0),

    // AI
    AI_DRIVER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
    AI_OPENAI_API_KEY: z.string().optional(),
    AI_ANTHROPIC_API_KEY: z.string().optional(),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
    AI_DEFAULT_MODEL: z.string().default('gpt-4o-mini'),

    // Outbox / worker
    OUTBOX_POLL_MS: z.coerce.number().int().positive().default(2_000),
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(2),

    // Seed
    SEED_DEMO_ACCOUNTS: booleanFromString.default(false),
    // Varsayılanı yok: koda gömülü parola, depo herkese açıkken doğrudan giriş
    // demektir. Tanımsızsa seed rastgele üretip bir kez log'a yazar.
    DEMO_PASSWORD: z.string().min(12).optional(),
    ADMIN_PASSWORD: z.string().min(12).optional(),

    /** Açılışta bekleyen Prisma migrasyonu varsa süreci durdur. Testte kapalı. */
    STRICT_MIGRATION_CHECK: booleanFromString.default(true),
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
      // Mock sağlayıcı para hareketi yapmadan ödemeyi başarılı sayar; canlıda
      // seçilmesi tahsil edilmemiş siparişlerin ödenmiş görünmesi demektir.
      // Tahsilat yapılmayacaksa doğru değer `disabled`.
      if (env.PAYMENT_DRIVER === 'mock') {
        ctx.addIssue({
          code: 'custom',
          path: ['PAYMENT_DRIVER'],
          message:
            'Mock ödeme sağlayıcısı production ortamında kullanılamaz. Tahsilat alınmayacaksa PAYMENT_DRIVER=disabled kullanın.',
        });
      }
      if (env.AI_DRIVER === 'mock') {
        ctx.addIssue({
          code: 'custom',
          path: ['AI_DRIVER'],
          message: 'Mock AI sürücüsü production ortamında kullanılamaz.',
        });
      }
      if (env.AI_DRIVER === 'openai' && !env.AI_OPENAI_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['AI_OPENAI_API_KEY'],
          message: 'OpenAI sürücüsü için AI_OPENAI_API_KEY zorunludur.',
        });
      }
      if (env.AI_DRIVER === 'anthropic' && !env.AI_ANTHROPIC_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['AI_ANTHROPIC_API_KEY'],
          message: 'Anthropic sürücüsü için AI_ANTHROPIC_API_KEY zorunludur.',
        });
      }
      if (!env.API_PUBLIC_URL.startsWith('https://')) {
        ctx.addIssue({
          code: 'custom',
          path: ['API_PUBLIC_URL'],
          message: 'Production ortamında API_PUBLIC_URL HTTPS olmalıdır.',
        });
      }
      if (env.CORS_ORIGINS.every((origin) => origin.includes('localhost'))) {
        ctx.addIssue({
          code: 'custom',
          path: ['CORS_ORIGINS'],
          message: 'Production ortamında CORS yalnızca localhost olamaz.',
        });
      }
      if (env.PUSH_DRIVER === 'mock') {
        ctx.addIssue({
          code: 'custom',
          path: ['PUSH_DRIVER'],
          message: 'Mock push sürücüsü production ortamında kullanılamaz.',
        });
      }
      if (env.MAIL_DRIVER === 'mock') {
        ctx.addIssue({
          code: 'custom',
          path: ['MAIL_DRIVER'],
          message: 'Mock e-posta sürücüsü production ortamında kullanılamaz.',
        });
      }
      if (env.MAIL_DRIVER === 'smtp' && !env.SMTP_HOST) {
        ctx.addIssue({
          code: 'custom',
          path: ['SMTP_HOST'],
          message: 'SMTP sürücüsü için SMTP_HOST zorunludur.',
        });
      }
      // Anahtarsız Resend sürücüsü hata fırlatmaz, gönderimi başarısız sayar;
      // e-posta doğrulama ve şifre sıfırlama buna bağlı olduğu için eksiklik
      // ancak kullanıcı bağlantıyı bekleyip alamayınca fark edilirdi.
      if (env.MAIL_DRIVER === 'resend' && !env.RESEND_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['RESEND_API_KEY'],
          message: 'Resend sürücüsü için RESEND_API_KEY zorunludur.',
        });
      }
      if (env.PAYMENT_DRIVER === 'iyzico' && (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY)) {
        ctx.addIssue({
          code: 'custom',
          path: ['IYZICO_API_KEY'],
          message: 'iyzico sürücüsü için IYZICO_API_KEY ve IYZICO_SECRET_KEY zorunludur.',
        });
      }
      if (env.SMS_DRIVER === 'mock') {
        ctx.addIssue({
          code: 'custom',
          path: ['SMS_DRIVER'],
          message: 'Mock SMS sürücüsü production ortamında kullanılamaz.',
        });
      }
      // Kimlik bilgisi eksik olan SMS sürücüsü hata fırlatmaz; gönderimi
      // "başarısız" işaretleyip sessizce geçer. Telefon doğrulaması buna bağlı
      // olduğu için eksiklik ancak kullanıcı kaydolamayınca fark edilirdi.
      if (env.SMS_DRIVER === 'netgsm' && (!env.NETGSM_USER || !env.NETGSM_PASS)) {
        ctx.addIssue({
          code: 'custom',
          path: ['NETGSM_USER'],
          message: 'Netgsm sürücüsü için NETGSM_USER ve NETGSM_PASS zorunludur.',
        });
      }
      if (
        env.SMS_DRIVER === 'twilio' &&
        (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['TWILIO_ACCOUNT_SID'],
          message:
            'Twilio sürücüsü için TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ve TWILIO_FROM zorunludur.',
        });
      }
      // Depolama anahtarları örnek dosyada CHANGE_ME ile geliyor; canlıda
      // kalırsa medya kovası varsayılan kimlikle erişilebilir olur.
      if (weakSecret(env.S3_ACCESS_KEY) || weakSecret(env.S3_SECRET_KEY)) {
        ctx.addIssue({
          code: 'custom',
          path: ['S3_SECRET_KEY'],
          message: 'Production ortamında varsayılan depolama anahtarları kullanılamaz.',
        });
      }
      // Tahsilat kapalıyken webhook zaten reddedildiği için anahtar aranmaz;
      // aksi hâlde hiç kullanılmayacak bir sır üretmek zorunlu kılınırdı.
      if (env.PAYMENT_DRIVER !== 'disabled' && weakSecret(env.PAYMENT_WEBHOOK_SECRET)) {
        ctx.addIssue({
          code: 'custom',
          path: ['PAYMENT_WEBHOOK_SECRET'],
          message: 'Production ortamında varsayılan webhook gizli anahtarı kullanılamaz.',
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
