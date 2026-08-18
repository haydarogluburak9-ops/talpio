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
