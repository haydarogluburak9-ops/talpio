import { validateEnv } from './env.schema';

const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

const productionBase = {
  ...baseEnv,
  NODE_ENV: 'production' as const,
  API_PUBLIC_URL: 'https://api.talpio.com',
  CORS_ORIGINS: 'https://app.talpio.com',
  PAYMENT_DRIVER: 'iyzico',
  PAYMENT_WEBHOOK_SECRET: 'c'.repeat(32),
  SMS_DRIVER: 'netgsm',
  NETGSM_USER: 'netgsm-kullanici',
  NETGSM_PASS: 'netgsm-parola',
  AI_DRIVER: 'openai',
  AI_OPENAI_API_KEY: 'sk-test',
  PUSH_DRIVER: 'expo',
  MAIL_DRIVER: 'smtp',
  SMTP_HOST: 'smtp.example.com',
  IYZICO_API_KEY: 'iy-key',
  IYZICO_SECRET_KEY: 'iy-secret',
};

describe('validateEnv', () => {
  it('varsayılan değerleri doldurur', () => {
    const env = validateEnv({ ...baseEnv });

    expect(env.NODE_ENV).toBe('development');
    expect(env.API_PORT).toBe(3000);
    // Son çare para birimi tek bir ülkeye bağlı olmamalı: kullanıcının ülkesi
    // ve dili çözülemediğinde herkese lira etiketi gösteriliyordu.
    expect(env.DEFAULT_CURRENCY).toBe('USD');
    expect(env.DEFAULT_LOCALE).toBe('en');
    expect(env.SUPPORTED_LOCALES).toEqual(['en', 'tr', 'de', 'es', 'fr', 'ar']);
  });

  it('virgülle ayrılmış listeleri diziye çevirir', () => {
    const env = validateEnv({
      ...baseEnv,
      CORS_ORIGINS: 'http://a.com, http://b.com ,',
    });

    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
  });

  it('sayısal değerleri metinden dönüştürür', () => {
    const env = validateEnv({ ...baseEnv, API_PORT: '8080', BCRYPT_ROUNDS: '13' });

    expect(env.API_PORT).toBe(8080);
    expect(env.BCRYPT_ROUNDS).toBe(13);
  });

  it('DATABASE_URL eksikse hata verir', () => {
    expect(() => validateEnv({ ...baseEnv, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('kısa JWT gizli anahtarını reddeder', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_ACCESS_SECRET: 'kisa' })).toThrow(
      /en az 32 karakter/,
    );
  });

  it('production ortamında demo hesaplarına izin vermez', () => {
    expect(() => validateEnv({ ...productionBase, SEED_DEMO_ACCOUNTS: 'true' })).toThrow(
      /Demo hesapları production/,
    );
  });

  it('production ortamında varsayılan gizli anahtarları reddeder', () => {
    expect(() =>
      validateEnv({
        ...productionBase,
        JWT_ACCESS_SECRET: 'change_me_access_secret_min_32_chars_long',
      }),
    ).toThrow(/varsayılan JWT gizli anahtarları/);
  });

  it('production ortamında mock ödeme sağlayıcısını reddeder', () => {
    expect(() =>
      validateEnv({
        ...productionBase,
        PAYMENT_DRIVER: 'mock',
      }),
    ).toThrow(/Mock ödeme sağlayıcısı production/);
  });

  it('tahsilat kapalıyken ödeme anahtarı istemez', () => {
    // İlk sürümde platform üzerinden tahsilat yok; kullanılmayacak bir webhook
    // sırrı ya da iyzico anahtarı zorunlu kılınmamalı.
    const env = validateEnv({
      ...productionBase,
      PAYMENT_DRIVER: 'disabled',
      PAYMENT_WEBHOOK_SECRET: undefined,
      IYZICO_API_KEY: undefined,
      IYZICO_SECRET_KEY: undefined,
    });

    expect(env.PAYMENT_DRIVER).toBe('disabled');
  });

  it('production ortamında mock AI sürücüsünü reddeder', () => {
    expect(() =>
      validateEnv({
        ...productionBase,
        AI_DRIVER: 'mock',
      }),
    ).toThrow(/Mock AI sürücüsü production/);
  });

  it('development ortamında AI_DRIVER=mock varsayılanıdır', () => {
    const env = validateEnv({ ...baseEnv });
    expect(env.AI_DRIVER).toBe('mock');
    expect(env.OUTBOX_POLL_MS).toBe(2000);
    expect(env.WORKER_CONCURRENCY).toBe(2);
  });

  it('production ortamında varsayılan webhook anahtarını reddeder', () => {
    expect(() =>
      validateEnv({
        ...productionBase,
        PAYMENT_WEBHOOK_SECRET: 'change_me_payment_webhook_secret',
      }),
    ).toThrow(/varsayılan webhook gizli anahtarı/);
  });

  it('production ortamında mock SMS sürücüsünü reddeder', () => {
    expect(() =>
      validateEnv({
        ...productionBase,
        SMS_DRIVER: 'mock',
      }),
    ).toThrow(/Mock SMS sürücüsü production/);
  });

  it('production ortamında kimlik bilgisi olmayan SMS sürücüsünü reddeder', () => {
    expect(() => validateEnv({ ...productionBase, NETGSM_PASS: undefined })).toThrow(
      /NETGSM_USER ve NETGSM_PASS/,
    );
    // Twilio üç değer ister; yalnızca SID verilmesi yetmez.
    expect(() =>
      validateEnv({ ...productionBase, SMS_DRIVER: 'twilio', TWILIO_ACCOUNT_SID: 'AC1' }),
    ).toThrow(/TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ve TWILIO_FROM/);
  });

  it('kimlik bilgisi tam olan SMS sürücüsünü kabul eder', () => {
    const env = validateEnv({
      ...productionBase,
      SMS_DRIVER: 'twilio',
      TWILIO_ACCOUNT_SID: 'AC1',
      TWILIO_AUTH_TOKEN: 'token',
      TWILIO_FROM: '+15550000000',
    });

    expect(env.SMS_DRIVER).toBe('twilio');
  });

  it('production ortamında varsayılan depolama anahtarlarını reddeder', () => {
    expect(() =>
      validateEnv({ ...productionBase, S3_SECRET_KEY: 'CHANGE_ME_MINIO_PASSWORD' }),
    ).toThrow(/varsayılan depolama anahtarları/);
  });

  it('production ortamında anahtarsız Resend sürücüsünü reddeder', () => {
    expect(() => validateEnv({ ...productionBase, MAIL_DRIVER: 'resend' })).toThrow(
      /RESEND_API_KEY/,
    );
  });

  it('anahtarı olan Resend sürücüsünü kabul eder', () => {
    const env = validateEnv({
      ...productionBase,
      MAIL_DRIVER: 'resend',
      RESEND_API_KEY: 're_test',
    });

    expect(env.MAIL_DRIVER).toBe('resend');
  });

  it('production ortamında mock push ve e-posta sürücülerini reddeder', () => {
    expect(() => validateEnv({ ...productionBase, PUSH_DRIVER: 'mock' })).toThrow(
      /Mock push sürücüsü production/,
    );
    expect(() => validateEnv({ ...productionBase, MAIL_DRIVER: 'mock' })).toThrow(
      /Mock e-posta sürücüsü production/,
    );
  });

  it('Expo push sürücüsü kimlik bilgisi istemez', () => {
    const env = validateEnv({ ...productionBase, EXPO_ACCESS_TOKEN: undefined });

    expect(env.PUSH_DRIVER).toBe('expo');
    expect(env.EXPO_ACCESS_TOKEN).toBeUndefined();
  });

  it('production ortamında HTTP API_PUBLIC_URL reddeder', () => {
    expect(() =>
      validateEnv({ ...productionBase, API_PUBLIC_URL: 'http://api.talpio.com' }),
    ).toThrow(/API_PUBLIC_URL HTTPS/);
  });

  it('production ortamında OpenAI anahtarı olmadan openai sürücüsünü reddeder', () => {
    expect(() => validateEnv({ ...productionBase, AI_OPENAI_API_KEY: undefined })).toThrow(
      /AI_OPENAI_API_KEY/,
    );
  });

  it('development ortamında demo hesaplarına izin verir', () => {
    const env = validateEnv({ ...baseEnv, SEED_DEMO_ACCOUNTS: 'true' });

    expect(env.SEED_DEMO_ACCOUNTS).toBe(true);
  });
});
