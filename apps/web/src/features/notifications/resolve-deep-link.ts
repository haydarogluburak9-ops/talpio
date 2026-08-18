import { parseDeepLink } from '@talpio/config';

/**
 * Platformdan bağımsız derin bağlantıyı web rotasına çevirir.
 * Tek hesap modelinde alıcı/satıcı ayrımı yapılmaz.
 */
export function resolveWebDeepLink(link: string | null | undefined): string | null {
  const target = parseDeepLink(link);
  if (!target) return null;

  switch (target.resource) {
    case 'job':
      return target.id ? `/taleplerim/${target.id}` : '/taleplerim';
    case 'commerce-request':
      return target.id ? `/tedarik/${target.id}` : '/tedarik';
    case 'job-offers':
      return target.id ? `/taleplerim/${target.id}` : '/taleplerim';
    case 'order':
      return target.id ? `/siparislerim/${target.id}` : '/siparislerim';
    case 'conversation':
      return target.id ? `/mesajlar/${target.id}` : '/mesajlar';
    case 'offers':
      return '/satici/panel';
    case 'reviews':
      return '/hesabim';
    case 'wallet':
    case 'payments':
      return '/satici/panel';
    case 'provider-profile':
      return '/profil';
    case 'support-ticket':
      return target.id ? `/destek/${target.id}` : '/destek';
    default:
      return null;
  }
}
