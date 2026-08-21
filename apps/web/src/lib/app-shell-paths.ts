/** Sosyal uygulama kabuğu (sidebar + bottom nav) kullanan yollar. */
export function isAppShellPath(pathname: string): boolean {
  if (pathname.startsWith('/u/')) return true;

  const roots = [
    '/gundem',
    '/akis',
    '/kesfet',
    '/tedarik',
    '/talep-olustur',
    '/mesajlar',
    '/bildirimler',
    '/hesabim',
    '/kategoriler',
    '/satici/panel',
    '/satici/tedarik',
    '/profil',
    '/odemeler',
  ];

  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

/** Giriş, kayıt, şifre ve ilgi alanı onboarding. */
export function isAuthPath(pathname: string): boolean {
  const roots = ['/giris', '/kayit', '/sifremi-unuttum', '/sifre-sifirla', '/dogrula-eposta', '/ilgi-alanlari'];
  return roots.some((root) => pathname === root || pathname.startsWith(`${root}/`));
}

/** Ana sayfa, yasal ve diğer public sayfalar — SaaS tarzı üst menü yok. */
export function isMinimalHeaderPath(pathname: string): boolean {
  return !isAppShellPath(pathname);
}
