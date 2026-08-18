import type { PlatformRoleCode } from '../enums/rbac';
import type { BusinessMembershipStatus } from '../enums/request';
import type { VerificationStatus } from '../enums/statuses';
import type { Permission } from '../enums/roles';
import type { BaseEntity } from './common';

export interface PlatformRole {
  id: string;
  code: PlatformRoleCode | string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
}

export interface Business extends BaseEntity {
  name: string;
  slug?: string | null;
  ownerUserId: string;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  minOrderQuantity?: string | null;
  providerProfileId?: string | null;
}

export interface BusinessMembership {
  id: string;
  businessId: string;
  userId: string;
  status: BusinessMembershipStatus;
  roleCodes: readonly string[];
}

export interface EffectivePermissions {
  userId: string;
  legacyRole: string;
  platformRoleCodes: readonly string[];
  permissionCodes: readonly Permission[];
  businessIds: readonly string[];
}
