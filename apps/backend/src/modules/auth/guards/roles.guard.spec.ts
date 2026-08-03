import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { UserRole } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';

import type { AuthenticatedUser } from '../jwt.strategy';
import { RolesGuard } from './roles.guard';

function contextFor(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function guardRequiring(roles: UserRole[] | undefined): RolesGuard {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles);
  return new RolesGuard(reflector);
}

/** Fırlatılan `AppException`'ın hata kodunu döner; başka hata tipinde testi düşürür. */
function codeOfThrown(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

const customer: AuthenticatedUser = {
  id: 'user-1',
  role: UserRole.CUSTOMER,
  sessionId: 'session-1',
};

describe('RolesGuard', () => {
  it('rol kısıtı olmayan uçlara izin verir', () => {
    expect(guardRequiring(undefined).canActivate(contextFor(customer))).toBe(true);
    expect(guardRequiring([]).canActivate(contextFor(customer))).toBe(true);
  });

  it('rolü eşleşen kullanıcıya izin verir', () => {
    const guard = guardRequiring([UserRole.CUSTOMER, UserRole.PROVIDER]);
    expect(guard.canActivate(contextFor(customer))).toBe(true);
  });

  it('rolü eşleşmeyen kullanıcıyı reddeder', () => {
    const guard = guardRequiring([UserRole.ADMIN]);

    expect(() => guard.canActivate(contextFor(customer))).toThrow(AppException);
    expect(codeOfThrown(() => guard.canActivate(contextFor(customer)))).toBe('FORBIDDEN');
  });

  it('kimliği olmayan isteği reddeder', () => {
    const guard = guardRequiring([UserRole.CUSTOMER]);
    expect(codeOfThrown(() => guard.canActivate(contextFor(undefined)))).toBe('UNAUTHORIZED');
  });

  it('müşteri rolü admin uçlarına erişemez', () => {
    const guard = guardRequiring([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(() => guard.canActivate(contextFor(customer))).toThrow(AppException);
  });

  it('süper admin, admin gerektiren uca rolü listede olduğunda erişir', () => {
    const guard = guardRequiring([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    const superAdmin: AuthenticatedUser = {
      id: 'user-2',
      role: UserRole.SUPER_ADMIN,
      sessionId: 'session-2',
    };

    expect(guard.canActivate(contextFor(superAdmin))).toBe(true);
  });
});
