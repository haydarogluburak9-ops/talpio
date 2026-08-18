import { parseDeepLink } from '@talpio/config';
import type { Href } from 'expo-router';

/**
 * Platformdan bağımsız derin bağlantıyı Expo Router yoluna çevirir.
 * Tek hesap modelinde alıcı/satıcı ayrımı yapılmaz; ilgili özelliğe gider.
 */
export function resolveMobileDeepLink(link: string | null | undefined): Href | null {
  const target = parseDeepLink(link);
  if (!target) return null;

  switch (target.resource) {
    case 'job':
      return target.id
        ? (`/customer/jobs/${target.id}` as Href)
        : ('/customer/(tabs)/jobs' as Href);
    case 'commerce-request':
      return target.id
        ? (`/customer/requests/${target.id}` as Href)
        : ('/customer/requests' as Href);
    case 'job-offers':
      return target.id
        ? (`/customer/jobs/${target.id}/offers` as Href)
        : ('/customer/(tabs)/jobs' as Href);
    case 'order':
      return target.id
        ? (`/customer/orders/${target.id}` as Href)
        : ('/customer/orders' as Href);
    case 'conversation':
      return target.id
        ? (`/customer/chat/${target.id}` as Href)
        : ('/customer/(tabs)/messages' as Href);
    case 'offers':
      return '/provider/offers' as Href;
    case 'reviews':
      return '/customer/reviews' as Href;
    case 'wallet':
    case 'payments':
      return '/provider/wallet' as Href;
    case 'provider-profile':
      return '/customer/profile/edit' as Href;
    case 'support-ticket':
      return target.id
        ? (`/customer/support/${target.id}` as Href)
        : ('/customer/support' as Href);
    default:
      return null;
  }
}
