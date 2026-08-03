import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const passwords = new PasswordService();

  it('parolayı düz metin olarak saklamaz', async () => {
    const hash = await passwords.hash('Guclu1Parola!');

    expect(hash).not.toContain('Guclu1Parola!');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('aynı parola için her seferinde farklı özet üretir', async () => {
    const [first, second] = await Promise.all([
      passwords.hash('Guclu1Parola!'),
      passwords.hash('Guclu1Parola!'),
    ]);

    expect(first).not.toBe(second);
  });

  it('doğru parolayı kabul eder', async () => {
    const hash = await passwords.hash('Guclu1Parola!');
    await expect(passwords.verify(hash, 'Guclu1Parola!')).resolves.toBe(true);
  });

  it('yanlış parolayı reddeder', async () => {
    const hash = await passwords.hash('Guclu1Parola!');
    await expect(passwords.verify(hash, 'YanlisParola1')).resolves.toBe(false);
  });

  it('bozuk özet için hata fırlatmadan false döner', async () => {
    await expect(passwords.verify('bozuk-ozet', 'Guclu1Parola!')).resolves.toBe(false);
  });
});
