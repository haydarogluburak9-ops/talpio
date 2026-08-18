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

/** Ad soyaddan profil kullanıcı adı önerisi üretir. */
export function suggestUsernameFromFullName(source: string): string {
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
