/**
 * Bildirimlerin taşıdığı derin bağlantı biçimi.
 *
 * Web rotaları Türkçe (`/siparislerim/:id`), mobil rotalar İngilizce ve role
 * göre ayrışır (`/customer/orders/:id` — `/provider/orders/:id`). Bu yüzden
 * sunucu hazır bir yol yazmaz; kaynak türü ve kimliğinden oluşan platformdan
 * bağımsız bir hedef üretir, her istemci kendi rotasına çevirir.
 *
 * Şema mobil uygulamanın `app.json` içindeki şemasıyla aynıdır; ileride işletim
 * sistemi düzeyinde bağlantı açmak için ek bir biçim gerekmez.
 */
export const DEEP_LINK_SCHEME = 'talpio';

/** Bağlantı hedefleri. Kimlik gerektirenler `:id` taşır, diğerleri listedir. */
export const DEEP_LINK_RESOURCES = [
  'job',
  'commerce-request',
  'job-offers',
  'order',
  'conversation',
  'offers',
  'reviews',
  'wallet',
  'payments',
  'provider-profile',
  'support-ticket',
  'social-profile',
  'social-post',
  'social-feed',
] as const;

export type DeepLinkResource = (typeof DEEP_LINK_RESOURCES)[number];

export interface DeepLinkTarget {
  resource: DeepLinkResource;
  id: string | null;
}

function build(resource: DeepLinkResource, id?: string): string {
  return id ? `${DEEP_LINK_SCHEME}://${resource}/${id}` : `${DEEP_LINK_SCHEME}://${resource}`;
}

export const deepLinks = {
  job: (id: string) => build('job', id),
  commerceRequest: (id: string) => build('commerce-request', id),
  /** Talebe gelen teklifler; müşteri tarafında karşılaştırma ekranı. */
  jobOffers: (id: string) => build('job-offers', id),
  order: (id: string) => build('order', id),
  conversation: (id: string) => build('conversation', id),
  /** Satıcının verdiği teklifler listesi. */
  offers: () => build('offers'),
  /** Satıcının aldığı değerlendirmeler. */
  reviews: () => build('reviews'),
  wallet: () => build('wallet'),
  payments: () => build('payments'),
  providerProfile: () => build('provider-profile'),
  supportTicket: (id: string) => build('support-ticket', id),
  socialProfile: (username: string) => build('social-profile', username),
  socialPost: (id: string) => build('social-post', id),
  socialFeed: () => build('social-feed'),
} as const;

/**
 * Hedefi ayrıştırır. Tanınmayan bağlantı `null` döner; istemci bu durumda
 * bildirimi tıklanamaz gösterir — yanlış ekrana götürmekten iyidir.
 */
export function parseDeepLink(link: string | null | undefined): DeepLinkTarget | null {
  if (!link) return null;

  const prefix = `${DEEP_LINK_SCHEME}://`;
  if (!link.startsWith(prefix)) return null;

  const [resource, id] = link.slice(prefix.length).split('/');
  if (!resource || !DEEP_LINK_RESOURCES.includes(resource as DeepLinkResource)) return null;

  return { resource: resource as DeepLinkResource, id: id ?? null };
}
