/**
 * Kullanıcı rolleri. Değerler Prisma `UserRole` enum'u ile birebir aynıdır;
 * backend, admin, web ve (OpenAPI üzerinden) mobil aynı sabitleri kullanır.
 */
export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  PROVIDER: 'PROVIDER',
  SUPPORT: 'SUPPORT',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ALL_USER_ROLES = Object.values(UserRole);

/** Talep açabilen ve teklif verebilen hesaplar. Personel hariç herkes her iki tarafı da kullanır. */
export const MARKETPLACE_ROLES: readonly UserRole[] = [UserRole.CUSTOMER, UserRole.PROVIDER];

export function isMarketplaceRole(role: UserRole): boolean {
  return MARKETPLACE_ROLES.includes(role);
}

/** Yönetim arayüzüne erişebilen roller. */
export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.SUPPORT,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

/**
 * Nesne bazlı yetkilendirme için ayrık izinler.
 *
 * Rol tek başına yeterli değildir: bir müşterinin yalnızca kendi işini
 * görebilmesi gibi kurallar `packages/business-logic` içindeki kontrollerle
 * birlikte uygulanır.
 */
export const Permission = {
  JOB_CREATE: 'job:create',
  JOB_READ_OWN: 'job:read:own',
  JOB_READ_ANY: 'job:read:any',
  JOB_UPDATE_OWN: 'job:update:own',
  JOB_CANCEL_OWN: 'job:cancel:own',
  JOB_MODERATE: 'job:moderate',

  OFFER_CREATE: 'offer:create',
  OFFER_READ_OWN: 'offer:read:own',
  OFFER_READ_FOR_OWN_JOB: 'offer:read:for-own-job',
  OFFER_READ_ANY: 'offer:read:any',
  OFFER_WITHDRAW_OWN: 'offer:withdraw:own',
  OFFER_ACCEPT: 'offer:accept',

  ORDER_READ_OWN: 'order:read:own',
  ORDER_READ_ANY: 'order:read:any',
  ORDER_UPDATE_STATUS: 'order:update:status',

  MESSAGE_SEND: 'message:send',
  MESSAGE_READ_OWN: 'message:read:own',
  MESSAGE_READ_ANY: 'message:read:any',

  REVIEW_CREATE: 'review:create',
  REVIEW_REPLY: 'review:reply',
  REVIEW_MODERATE: 'review:moderate',

  PROVIDER_PROFILE_MANAGE_OWN: 'provider-profile:manage:own',
  PROVIDER_DOCUMENT_UPLOAD_OWN: 'provider-document:upload:own',
  PROVIDER_DOCUMENT_VERIFY: 'provider-document:verify',

  PAYMENT_READ_OWN: 'payment:read:own',
  PAYMENT_READ_ANY: 'payment:read:any',
  PAYMENT_REFUND: 'payment:refund',

  SUPPORT_TICKET_CREATE: 'support-ticket:create',
  SUPPORT_TICKET_READ_OWN: 'support-ticket:read:own',
  SUPPORT_TICKET_HANDLE: 'support-ticket:handle',

  CATALOG_MANAGE: 'catalog:manage',
  USER_MANAGE: 'user:manage',
  SETTINGS_MANAGE: 'settings:manage',
  ROLE_MANAGE: 'role:manage',
  AUDIT_LOG_READ: 'audit-log:read',

  /** Commerce Request (B2B / talep odaklı) izinleri */
  REQUEST_CREATE: 'request.create',
  REQUEST_READ_OWN: 'request.read.own',
  REQUEST_READ_MATCHED: 'request.read.matched',
  REQUEST_UPDATE_OWN: 'request.update.own',
  REQUEST_CANCEL_OWN: 'request.cancel.own',
  REQUEST_OFFER_CREATE: 'request.offer.create',
  REQUEST_OFFER_READ_OWN: 'request.offer.read.own',
  REQUEST_OFFER_UPDATE_OWN: 'request.offer.update.own',
  REQUEST_OFFER_ACCEPT: 'request.offer.accept',
  SUPPLIER_PROFILE_MANAGE: 'supplier.profile.manage',
  CAMPAIGN_CREATE: 'campaign.create',
  CAMPAIGN_READ_TARGETED: 'campaign.read.targeted',
  CRM_CUSTOMER_MANAGE: 'crm.customer.manage',
  WORKORDER_MANAGE: 'workorder.manage',
  ADMIN_REQUEST_MODERATE: 'admin.request.moderate',

  /** Ücretsiz sosyal katman */
  SOCIAL_PROFILE_MANAGE: 'social.profile.manage',
  SOCIAL_POST_CREATE: 'social.post.create',
  SOCIAL_INTERACT: 'social.interact',
  SOCIAL_REPORT: 'social.report',
  ADMIN_SOCIAL_MODERATE: 'admin.social.moderate',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
