import { type Reflector } from '@nestjs/core';
import { Permission, UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { RbacService } from '@modules/rbac/rbac.service';

import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionsGuard } from './permissions.guard';

function mockContext(user: unknown, handlerMeta?: Permission[]) {
  const reflector = {
    getAllAndOverride: jest.fn((_key: string) => handlerMeta),
  } as unknown as Reflector;

  const request = { user };
  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  };

  return { reflector, context, request };
}

describe('PermissionsGuard', () => {
  const rbac = {
    getEffectivePermissions: jest.fn(),
  } as unknown as RbacService;

  it('decorator yoksa geçer', async () => {
    const { reflector, context } = mockContext({ id: 'u1', role: UserRole.CUSTOMER });
    const guard = new PermissionsGuard(reflector, rbac);
    await expect(guard.canActivate(context as never)).resolves.toBe(true);
  });

  it('izin yoksa FORBIDDEN fırlatır', async () => {
    const { reflector, context } = mockContext(
      {
        id: 'u1',
        role: UserRole.CUSTOMER,
        permissionCodes: [Permission.JOB_CREATE],
      },
      [Permission.REQUEST_OFFER_CREATE],
    );
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.REQUEST_OFFER_CREATE]);
    const guard = new PermissionsGuard(reflector, rbac);

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(AppException);
  });

  it('izin varsa geçer', async () => {
    const { reflector, context } = mockContext({
      id: 'u1',
      role: UserRole.CUSTOMER,
      permissionCodes: [Permission.REQUEST_CREATE],
    });
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Permission.REQUEST_CREATE]);
    const guard = new PermissionsGuard(reflector, rbac);

    await expect(guard.canActivate(context as never)).resolves.toBe(true);
  });

  it('izinler yoksa RbacService çağırır', async () => {
    const { reflector, context, request } = mockContext({
      id: 'u1',
      role: UserRole.CUSTOMER,
    });
    const getAllAndOverride = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([Permission.REQUEST_CREATE]);
    (rbac.getEffectivePermissions as jest.Mock).mockResolvedValue({
      permissionCodes: [Permission.REQUEST_CREATE],
      businessIds: [],
      platformRoleCodes: ['buyer'],
    });

    const guard = new PermissionsGuard(reflector, rbac);
    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect((request.user as { permissionCodes?: string[] }).permissionCodes).toContain(
      Permission.REQUEST_CREATE,
    );
    expect(getAllAndOverride).toHaveBeenCalledWith(PERMISSIONS_KEY, expect.any(Array));
  });
});
