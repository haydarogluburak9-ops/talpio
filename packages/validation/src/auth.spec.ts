import { UserRole } from '@ustapilot/types';

import { loginSchema, registerSchema } from './auth';

const validRegistration = {
  fullName: 'Ayşe Yılmaz',
  email: 'ayse@example.com',
  password: 'Guclu1Parola',
  passwordConfirmation: 'Guclu1Parola',
  role: UserRole.CUSTOMER,
  acceptedTerms: true as const,
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

  it('personel rollerinin kendi kendine seçilmesine izin vermez', () => {
    for (const role of [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT]) {
      expect(registerSchema.safeParse({ ...validRegistration, role }).success).toBe(false);
    }
  });

  it('usta rolüne izin verir', () => {
    const result = registerSchema.safeParse({ ...validRegistration, role: UserRole.PROVIDER });
    expect(result.success).toBe(true);
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
});

describe('loginSchema', () => {
  it('geçerli girişi kabul eder', () => {
    const result = loginSchema.safeParse({ email: 'ayse@example.com', password: 'x' });
    expect(result.success).toBe(true);
  });

  it('boş şifreyi reddeder', () => {
    const result = loginSchema.safeParse({ email: 'ayse@example.com', password: '' });
    expect(result.success).toBe(false);
  });

  // Girişte karmaşıklık kuralı uygulanmaz: eski parolalar farklı politikalarla
  // oluşturulmuş olabilir, doğrulama sunucudaki özetle karşılaştırma ile yapılır.
  it('basit şifreyle girişe izin verir', () => {
    const result = loginSchema.safeParse({ email: 'ayse@example.com', password: 'abc' });
    expect(result.success).toBe(true);
  });
});
