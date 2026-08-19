import { loginSchema, registerSchema } from './auth';

const validRegistration = {
  fullName: 'Ayşe Yılmaz',
  username: 'ayse.yilmaz',
  email: 'ayse@example.com',
  password: 'Guclu1Parola',
  passwordConfirmation: 'Guclu1Parola',
  acceptedTerms: true as const,
  interestCategoryIds: [
    '0194a1b2-c3d4-7000-8000-000000000001',
    '0194a1b2-c3d4-7000-8000-000000000002',
    '0194a1b2-c3d4-7000-8000-000000000003',
  ],
};

describe('registerSchema', () => {
  it('geçerli kaydı kabul eder', () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it('e-postayı küçük harfe indirger', () => {
    const result = registerSchema.parse({ ...validRegistration, email: '  AYSE@Example.COM ' });
    expect(result.email).toBe('ayse@example.com');
  });

  it('geçersiz e-postayı reddeder', () => {
    const result = registerSchema.safeParse({ ...validRegistration, email: 'ayse[at]example' });
    expect(result.success).toBe(false);
  });

  it('şifreler eşleşmediğinde ilgili alana hata koyar', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      passwordConfirmation: 'BaskaParola1',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['passwordConfirmation']);
  });

  it('kısa şifreyi reddeder', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: 'Kisa1',
      passwordConfirmation: 'Kisa1',
    });

    expect(result.success).toBe(false);
  });

  it('koşullar kabul edilmediğinde reddeder', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      acceptedTerms: false,
    });

    expect(result.success).toBe(false);
  });

  it('geçersiz kullanıcı adını reddeder', () => {
    const result = registerSchema.safeParse({ ...validRegistration, username: 'A' });
    expect(result.success).toBe(false);
  });

  it('E.164 dışındaki telefon numarasını reddeder', () => {
    const result = registerSchema.safeParse({ ...validRegistration, phone: '0532 123 45 67' });
    expect(result.success).toBe(false);
  });

  it('E.164 telefon numarasını kabul eder', () => {
    const result = registerSchema.safeParse({ ...validRegistration, phone: '+905321234567' });
    expect(result.success).toBe(true);
  });

  // Form denetimleri boş alanı `""` olarak gönderir. Bu değer "girilmedi"
  // sayılmazsa isteğe bağlı telefon alanı zorunlu gibi davranır ve kayıt kilitlenir.
  it('boş bırakılan telefon alanını girilmemiş sayar', () => {
    const result = registerSchema.safeParse({ ...validRegistration, phone: '' });

    expect(result.success).toBe(true);
    expect(result.data?.phone).toBeUndefined();
  });

  it('yalnızca boşluk içeren telefon alanını da girilmemiş sayar', () => {
    const result = registerSchema.safeParse({ ...validRegistration, phone: '   ' });

    expect(result.success).toBe(true);
    expect(result.data?.phone).toBeUndefined();
  });

  it('üçten az ilgi alanını reddeder', () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      interestCategoryIds: validRegistration.interestCategoryIds.slice(0, 2),
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('e-posta ile geçerli girişi kabul eder', () => {
    const result = loginSchema.safeParse({ identifier: 'ayse@example.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('kullanıcı adı ile geçerli girişi kabul eder', () => {
    const result = loginSchema.safeParse({ identifier: '@ayse.yilmaz', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('telefon ile geçerli girişi kabul eder', () => {
    const result = loginSchema.safeParse({ identifier: '+905321234567', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('boş giriş bilgisini reddeder', () => {
    const result = loginSchema.safeParse({ identifier: '', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('boş şifreyi reddeder', () => {
    const result = loginSchema.safeParse({ identifier: 'ayse@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  // Girişte karmaşıklık kuralı uygulanmaz: eski parolalar farklı politikalarla
  // oluşturulmuş olabilir, doğrulama sunucudaki özetle karşılaştırma ile yapılır.
  it('basit şifreyle girişe izin verir', () => {
    const result = loginSchema.safeParse({ identifier: 'ayse@example.com', password: 'abc' });
    expect(result.success).toBe(true);
  });
});
