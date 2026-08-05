import { parseDeepLink } from '@ustapilot/config';
import { UserRole } from '@ustapilot/types';

/**
 * Platformdan bağımsız derin bağlantıyı web rotasına çevirir.
 *
 * Rol, sipariş ve teklif ekranlarının müşteri/usta yolunu seçer. Tanınmayan
 * bağlantı `null` döner; çağıran tıklamayı devre dışı bırakır.
 */
export function resolveWebDeepLink(
  link: string | null | undefined,
  role: UserRole | null | undefined,
): string | null {
  const target = parseDeepLink(link);
  if (!target) return null;

  const isProvider = role === UserRole.PROVIDER;

  switch (target.resource) {
    case 'job':
      return target.id
        ? isProvider
          ? `/usta/panel` // Havuz detayı web'de ayrı rota taşımıyor; panele düşer.
          : `/taleplerim/${target.id}`
        : isProvider
          ? '/usta/panel'
          : '/taleplerim';
    case 'job-offers':
      return target.id ? `/taleplerim/${target.id}` : '/taleplerim';
    case 'order':
      return target.id ? `/siparislerim/${target.id}` : '/siparislerim';
    case 'conversation':
      return target.id ? `/mesajlar/${target.id}` : '/mesajlar';
    case 'offers':
      return '/usta/panel';
    case 'reviews':
      return isProvider ? '/usta/panel' : '/hesabim';
    case 'wallet':
    case 'payments':
      return isProvider ? '/usta/panel' : '/siparislerim';
    case 'provider-profile':
      return '/profil';
    default:
      return null;
  }
}
