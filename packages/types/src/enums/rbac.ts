/**
 * Platform rolleri. DB `PlatformRole.code` ile birebir; legacy `UserRole`
 * enum'undan bağımsız genişletilebilir kimliklerdir.
 */
export const PlatformRoleCode = {
  BUYER: 'buyer',
  SUPPLIER: 'supplier',
  SERVICE_PROVIDER: 'service_provider',
  MANUFACTURER: 'manufacturer',
  DISTRIBUTOR: 'distributor',
  WHOLESALER: 'wholesaler',
  DEALER: 'dealer',
  ENTERPRISE_MEMBER: 'enterprise_member',
  ENTERPRISE_ADMIN: 'enterprise_admin',
  PLATFORM_ADMIN: 'platform_admin',
  SUPPORT_AGENT: 'support_agent',
} as const;

export type PlatformRoleCode = (typeof PlatformRoleCode)[keyof typeof PlatformRoleCode];

export const ALL_PLATFORM_ROLE_CODES = Object.values(PlatformRoleCode);
