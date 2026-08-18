const TR_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  Ç: 'c',
  Ğ: 'g',
  İ: 'i',
  I: 'i',
  Ö: 'o',
  Ş: 's',
  Ü: 'u',
};

/** Tam adı küçük harf slug'a çevirir (Türkçe karakterler latinize edilir). */
export function slugifyUsername(source: string): string {
  const mapped = [...source.trim()]
    .map((ch) => TR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.+/g, '.');

  const base = mapped.slice(0, 24) || 'user';
  return base.length < 3 ? `${base}usr`.slice(0, 3) : base;
}

export function withUsernameSuffix(base: string, suffix: string): string {
  const trimmed = base.slice(0, Math.max(3, 32 - suffix.length - 1));
  return `${trimmed}${suffix}`;
}

/** Sistem tarafından ayrılmış kullanıcı adları. */
export const RESERVED_USERNAMES = new Set([
  'admin',
  'talpio',
  'destek',
  'support',
  'help',
  'api',
  'www',
  'giris',
  'kayit',
  'akis',
  'kesfet',
  'tedarik',
  'moderasyon',
  'root',
  'system',
  'null',
  'undefined',
]);

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsernameFormat(username: string): boolean {
  return /^[a-z0-9._]{3,32}$/.test(username);
}
