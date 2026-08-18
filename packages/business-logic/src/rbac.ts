import {
  Permission,
  PlatformRoleCode,
  UserRole,
  type PlatformRoleCode as PlatformRoleCodeT,
} from '@talpio/types';

import { ROLE_PERMISSIONS } from './permissions';

/**
 * Platform rol → izin matrisi. Seed ile DB'ye de yazılır; runtime birleşimde
 * legacy UserRole izinleriyle birleştirilir.
 */
export const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRoleCodeT, readonly Permission[]> = {
  [PlatformRoleCode.BUYER]: [
    Permission.REQUEST_CREATE,
    Permission.REQUEST_READ_OWN,
    Permission.REQUEST_UPDATE_OWN,
    Permission.REQUEST_CANCEL_OWN,
    Permission.REQUEST_OFFER_ACCEPT,
    Permission.SOCIAL_PROFILE_MANAGE,
    Permission.SOCIAL_POST_CREATE,
    Permission.SOCIAL_INTERACT,
    Permission.SOCIAL_REPORT,
  ],
  [PlatformRoleCode.SUPPLIER]: [
    Permission.REQUEST_READ_MATCHED,
    Permission.REQUEST_OFFER_CREATE,
    Permission.REQUEST_OFFER_READ_OWN,
    Permission.REQUEST_OFFER_UPDATE_OWN,
    Permission.SUPPLIER_PROFILE_MANAGE,
    Permission.SOCIAL_PROFILE_MANAGE,
    Permission.SOCIAL_POST_CREATE,
    Permission.SOCIAL_INTERACT,
    Permission.SOCIAL_REPORT,
  ],
  [PlatformRoleCode.SERVICE_PROVIDER]: [
    Permission.REQUEST_READ_MATCHED,
    Permission.REQUEST_OFFER_CREATE,
    Permission.REQUEST_OFFER_READ_OWN,
    Permission.REQUEST_OFFER_UPDATE_OWN,
    Permission.SUPPLIER_PROFILE_MANAGE,
    Permission.SOCIAL_PROFILE_MANAGE,
    Permission.SOCIAL_POST_CREATE,
    Permission.SOCIAL_INTERACT,
    Permission.SOCIAL_REPORT,
  ],
  [PlatformRoleCode.MANUFACTURER]: [
    Permission.REQUEST_READ_MATCHED,
    Permission.REQUEST_OFFER_CREATE,
    Permission.REQUEST_OFFER_READ_OWN,
    Permission.SUPPLIER_PROFILE_MANAGE,
  ],
  [PlatformRoleCode.DISTRIBUTOR]: [
    Permission.REQUEST_READ_MATCHED,
    Permission.REQUEST_OFFER_CREATE,
    Permission.REQUEST_OFFER_READ_OWN,
    Permission.SUPPLIER_PROFILE_MANAGE,
  ],
  [PlatformRoleCode.WHOLESALER]: [
    Permission.REQUEST_READ_MATCHED,
    Permission.REQUEST_OFFER_CREATE,
    Permission.SUPPLIER_PROFILE_MANAGE,
  ],
  [PlatformRoleCode.DEALER]: [
    Permission.REQUEST_READ_MATCHED,
    Permission.REQUEST_OFFER_CREATE,
    Permission.SUPPLIER_PROFILE_MANAGE,
  ],
  [PlatformRoleCode.ENTERPRISE_MEMBER]: [
    Permission.REQUEST_CREATE,
    Permission.REQUEST_READ_OWN,
    Permission.CRM_CUSTOMER_MANAGE,
  ],
  [PlatformRoleCode.ENTERPRISE_ADMIN]: [
    Permission.REQUEST_CREATE,
    Permission.REQUEST_READ_OWN,
    Permission.REQUEST_UPDATE_OWN,
    Permission.REQUEST_CANCEL_OWN,
    Permission.REQUEST_OFFER_ACCEPT,
    Permission.CRM_CUSTOMER_MANAGE,
    Permission.WORKORDER_MANAGE,
    Permission.CAMPAIGN_CREATE,
  ],
  [PlatformRoleCode.PLATFORM_ADMIN]: [
    Permission.ADMIN_REQUEST_MODERATE,
    Permission.ADMIN_SOCIAL_MODERATE,
    Permission.REQUEST_READ_OWN,
    Permission.REQUEST_READ_MATCHED,
  ],
  [PlatformRoleCode.SUPPORT_AGENT]: [Permission.ADMIN_REQUEST_MODERATE],
};

/** Legacy UserRole → varsayılan platform rol kodları. */
export const LEGACY_ROLE_TO_PLATFORM: Record<UserRole, readonly PlatformRoleCodeT[]> = {
  [UserRole.CUSTOMER]: [PlatformRoleCode.BUYER, PlatformRoleCode.SERVICE_PROVIDER],
  [UserRole.PROVIDER]: [PlatformRoleCode.BUYER, PlatformRoleCode.SERVICE_PROVIDER],
  [UserRole.SUPPORT]: [PlatformRoleCode.SUPPORT_AGENT],
  [UserRole.ADMIN]: [PlatformRoleCode.PLATFORM_ADMIN],
  [UserRole.SUPER_ADMIN]: [PlatformRoleCode.PLATFORM_ADMIN],
};

export function mergeLegacyAndPlatformPermissions(
  userRole: UserRole,
  platformRoleCodes: readonly string[],
): Permission[] {
  const set = new Set<Permission>(ROLE_PERMISSIONS[userRole] ?? []);

  for (const code of platformRoleCodes) {
    const perms = PLATFORM_ROLE_PERMISSIONS[code as PlatformRoleCodeT];
    if (perms) {
      for (const p of perms) set.add(p);
    }
  }

  // Legacy rolün varsayılan platform karşılığını da ekle (henüz assignment yoksa).
  if (platformRoleCodes.length === 0) {
    for (const code of LEGACY_ROLE_TO_PLATFORM[userRole] ?? []) {
      for (const p of PLATFORM_ROLE_PERMISSIONS[code] ?? []) set.add(p);
    }
  }

  return [...set];
}

export function hasEffectivePermission(
  codes: readonly string[],
  permission: Permission | string,
): boolean {
  return codes.includes(permission);
}

export function resolveEffectivePermissions(
  userRole: UserRole,
  platformRoleCodes: readonly string[],
): readonly Permission[] {
  return mergeLegacyAndPlatformPermissions(userRole, platformRoleCodes);
}
