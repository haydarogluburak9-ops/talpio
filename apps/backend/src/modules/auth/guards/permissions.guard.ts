import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@talpio/types';
import { hasEffectivePermission } from '@talpio/business-logic';
import type { Request } from 'express';

import { AppException } from '@common/errors/app.exception';
import { RbacService } from '@modules/rbac/rbac.service';

import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../jwt.strategy';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<
      Request & { user?: AuthenticatedUser }
    >();
    const user = request.user;

    if (!user) {
      throw new AppException('UNAUTHORIZED', { message: 'Bu işlem için giriş yapmalısınız.' });
    }

    // JWT validate sırasında eklenen izinler yoksa DB'den yükle.
    let codes = user.permissionCodes;
    if (!codes) {
      const effective = await this.rbac.getEffectivePermissions(user.id);
      codes = effective.permissionCodes;
      user.permissionCodes = [...effective.permissionCodes];
      user.businessIds = [...effective.businessIds];
      user.platformRoleCodes = [...effective.platformRoleCodes];
    }

    const allowed = required.some((permission) => hasEffectivePermission(codes!, permission));
    if (!allowed) {
      throw new AppException('FORBIDDEN', {
        message: 'Bu işlem için yetkiniz yok.',
        context: { requiredPermissions: required },
      });
    }

    return true;
  }
}
