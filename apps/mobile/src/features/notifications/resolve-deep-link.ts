import { parseDeepLink } from '@ustapilot/config';
import { UserRole } from '@ustapilot/types';
import type { Href } from 'expo-router';

/**
 * Platformdan bağımsız derin bağlantıyı Expo Router yoluna çevirir.
 * Rol, müşteri ve usta ekran ağaçlarını ayırır.
 */
export function resolveMobileDeepLink(
  link: string | null | undefined,
  role: UserRole | null | undefined,
): Href | null {
  const target = parseDeepLink(link);
  if (!target) return null;

  const isProvider = role === UserRole.PROVIDER;
  const root = isProvider ? '/provider' : '/customer';

  switch (target.resource) {
    case 'job':
      if (target.id) return `${root}/jobs/${target.id}` as Href;
      return (isProvider ? '/provider/(tabs)/available' : '/customer/(tabs)/jobs') as Href;
    case 'job-offers':
      return target.id
        ? (`/customer/jobs/${target.id}/offers` as Href)
        : ('/customer/(tabs)/jobs' as Href);
    case 'order':
      return target.id
        ? (`${root}/orders/${target.id}` as Href)
        : isProvider
          ? ('/provider/(tabs)/active' as Href)
          : ('/customer/orders' as Href);
    case 'conversation':
      return target.id
        ? (`${root}/chat/${target.id}` as Href)
        : isProvider
          ? ('/provider/messages' as Href)
          : ('/customer/(tabs)/messages' as Href);
    case 'offers':
      return '/provider/offers' as Href;
    case 'reviews':
      return isProvider ? ('/provider/reviews' as Href) : ('/customer/reviews' as Href);
    case 'wallet':
      return '/provider/wallet' as Href;
    case 'payments':
      return isProvider ? ('/provider/wallet' as Href) : ('/customer/payments' as Href);
    case 'provider-profile':
      return isProvider
        ? ('/provider/profile/edit' as Href)
        : ('/customer/(tabs)/profile' as Href);
    default:
      return null;
  }
}
