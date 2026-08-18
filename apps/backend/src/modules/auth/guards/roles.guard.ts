import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new AppException('UNAUTHORIZED', { message: 'Bu işlem için giriş yapmalısınız.' });
    }

    if (!required.includes(user.role)) {
      throw new AppException('FORBIDDEN', {
        message: 'Bu işlem için yetkiniz yok.',
        context: { requiredRoles: required, actualRole: user.role },
      });
    }

    return true;
  }
}
