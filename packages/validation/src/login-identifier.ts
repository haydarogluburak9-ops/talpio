export type LoginIdentifierKind = 'email' | 'phone' | 'username';

export type ParsedLoginIdentifier =
  | { kind: 'email'; value: string }
  | { kind: 'phone'; value: string }
  | { kind: 'username'; value: string };

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/** Boşluk, tire ve parantezleri kaldırır; telefon adayı mı kontrol eder. */
function looksLikePhone(raw: string): boolean {
  const compact = raw.replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(compact)) return false;
  const digits = compact.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function normalizePhone(raw: string, defaultPhoneCountry: string): string {
  let compact = raw.replace(/[\s\-().]/g, '');

  if (compact.startsWith('00')) {
    compact = `+${compact.slice(2)}`;
  } else if (compact.startsWith('0')) {
    compact = `${defaultPhoneCountry}${compact.slice(1)}`;
  } else if (!compact.startsWith('+')) {
    compact = `${defaultPhoneCountry}${compact}`;
  }

  return compact;
}

/**
 * Giriş alanındaki ham değeri e-posta, E.164 telefon veya kullanıcı adına ayırır.
 * Sıra: `@` içeriyorsa e-posta; telefon gibi görünüyorsa telefon; aksi halde kullanıcı adı.
 */
export function parseLoginIdentifier(
  raw: string,
  defaultPhoneCountry = '+90',
): ParsedLoginIdentifier {
  let trimmed = raw.trim();
  if (trimmed.startsWith('@')) {
    trimmed = trimmed.slice(1).trim();
  }

  if (trimmed.includes('@')) {
    return { kind: 'email', value: trimmed.toLowerCase() };
  }

  if (looksLikePhone(trimmed)) {
    const phone = normalizePhone(trimmed, defaultPhoneCountry);
    if (E164_REGEX.test(phone)) {
      return { kind: 'phone', value: phone };
    }
  }

  return { kind: 'username', value: trimmed.toLowerCase() };
}
