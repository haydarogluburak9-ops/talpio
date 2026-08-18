import { Injectable } from '@nestjs/common';
import {
  LEGACY_ROLE_TO_PLATFORM,
  mergeLegacyAndPlatformPermissions,
} from '@talpio/business-logic';
import {
  BusinessMembershipStatus,
  PlatformRoleCode,
  type EffectivePermissions,
  type Permission,
  type UserRole,
} from '@talpio/types';

import { writeAudit } from '@common/audit/write-audit';
import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        role: true,
        platformRoleAssignments: {
          select: { role: { select: { code: true, permissions: { select: { permissionCode: true } } } } },
        },
        businessMemberships: {
          where: { status: BusinessMembershipStatus.ACTIVE },
          select: {
            businessId: true,
            roles: { select: { role: { select: { code: true, permissions: { select: { permissionCode: true } } } } } },
          },
        },
      },
    });

    if (!user) {
      throw new AppException('UNAUTHORIZED', { message: 'Kullanıcı bulunamadı.' });
    }

    const platformRoleCodes = new Set<string>();
    const dbPermissionCodes = new Set<string>();

    for (const assignment of user.platformRoleAssignments) {
      platformRoleCodes.add(assignment.role.code);
      for (const p of assignment.role.permissions) dbPermissionCodes.add(p.permissionCode);
    }

    for (const membership of user.businessMemberships) {
      for (const roleAssignment of membership.roles) {
        platformRoleCodes.add(roleAssignment.role.code);
        for (const p of roleAssignment.role.permissions) {
          dbPermissionCodes.add(p.permissionCode);
        }
      }
    }

    const codes = [...platformRoleCodes];
    const merged = mergeLegacyAndPlatformPermissions(user.role as UserRole, codes);

    // DB RolePermission kayıtları da birleşime eklenir (seed / admin override).
    for (const code of dbPermissionCodes) {
      if (!merged.includes(code as Permission)) {
        merged.push(code as Permission);
      }
    }

    return {
      userId: user.id,
      legacyRole: user.role,
      platformRoleCodes: codes,
      permissionCodes: merged,
      businessIds: user.businessMemberships.map((m) => m.businessId),
    };
  }

  async assignPlatformRole(userId: string, roleCode: string): Promise<void> {
    const role = await this.prisma.platformRole.findUnique({
      where: { code: roleCode },
      select: { id: true },
    });
    if (!role) {
      throw new AppException('VALIDATION_ERROR', {
        message: `Platform rolü bulunamadı: ${roleCode}`,
      });
    }

    await this.prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      update: {},
      create: { userId, roleId: role.id },
    });
    void writeAudit(this.prisma, {
      actorId: userId,
      action: 'rbac.role.assign',
      entityType: 'User',
      entityId: userId,
      changes: { roleCode },
    });
  }

  async assignDefaultPlatformRole(userId: string, legacyRole: UserRole): Promise<void> {
    for (const code of LEGACY_ROLE_TO_PLATFORM[legacyRole] ?? []) {
      await this.assignPlatformRole(userId, code);
    }
  }

  async ensureMembership(input: {
    businessId: string;
    userId: string;
    roleCodes?: readonly string[];
  }): Promise<string> {
    const membership = await this.prisma.businessMembership.upsert({
      where: {
        businessId_userId: { businessId: input.businessId, userId: input.userId },
      },
      update: { status: BusinessMembershipStatus.ACTIVE },
      create: {
        businessId: input.businessId,
        userId: input.userId,
        status: BusinessMembershipStatus.ACTIVE,
      },
    });

    for (const code of input.roleCodes ?? [PlatformRoleCode.SUPPLIER]) {
      const role = await this.prisma.platformRole.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!role) continue;

      await this.prisma.businessRoleAssignment.upsert({
        where: { membershipId_roleId: { membershipId: membership.id, roleId: role.id } },
        update: {},
        create: { membershipId: membership.id, roleId: role.id },
      });
    }

    return membership.id;
  }

  async assertBusinessAccess(userId: string, businessId: string): Promise<void> {
    const membership = await this.prisma.businessMembership.findFirst({
      where: {
        businessId,
        userId,
        status: BusinessMembershipStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new AppException('FORBIDDEN', {
        message: 'Bu işletmeye erişim yetkiniz yok.',
        context: { businessId },
      });
    }
  }
}
