import { validateEnv } from './env.schema';

const baseEnv = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('varsayılan değerleri doldurur', () => {
    const env = validateEnv({ ...baseEnv });

    expect(env.NODE_ENV).toBe('development');
    expect(env.API_PORT).toBe(3000);
    expect(env.DEFAULT_CURRENCY).toBe('TRY');
    expect(env.SUPPORTED_LOCALES).toEqual(['tr', 'en']);
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
    expect(() =>
      validateEnv({ ...baseEnv, NODE_ENV: 'production', SEED_DEMO_ACCOUNTS: 'true' }),
    ).toThrow(/Demo hesapları production/);
  });

  it('production ortamında varsayılan gizli anahtarları reddeder', () => {
    expect(() =>
      validateEnv({
        ...baseEnv,
        NODE_ENV: 'production',
        JWT_ACCESS_SECRET: 'change_me_access_secret_min_32_chars_long',
      }),
    ).toThrow(/varsayılan JWT gizli anahtarları/);
  });

  it('development ortamında demo hesaplarına izin verir', () => {
    const env = validateEnv({ ...baseEnv, SEED_DEMO_ACCOUNTS: 'true' });

    expect(env.SEED_DEMO_ACCOUNTS).toBe(true);
  });
});
