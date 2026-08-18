import { UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';

import { RbacService } from './rbac.service';

describe('RbacService', () => {
  const prisma = {
    user: { findFirst: jest.fn() },
    platformRole: { findUnique: jest.fn() },
    userRoleAssignment: { upsert: jest.fn() },
    businessMembership: { upsert: jest.fn(), findFirst: jest.fn() },
    businessRoleAssignment: { upsert: jest.fn() },
  };

  const service = new RbacService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('legacy CUSTOMER için buyer izinlerini birleştirir', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      role: UserRole.CUSTOMER,
      platformRoleAssignments: [],
      businessMemberships: [],
    });

    const result = await service.getEffectivePermissions('u1');
    expect(result.permissionCodes).toContain('request.create');
    expect(result.permissionCodes).toContain('job:create');
  });

  it('tenant: üye değilse assertBusinessAccess FORBIDDEN', async () => {
    prisma.businessMembership.findFirst.mockResolvedValue(null);
    await expect(service.assertBusinessAccess('u1', 'b1')).rejects.toBeInstanceOf(AppException);
  });

  it('üyeyse assertBusinessAccess geçer', async () => {
    prisma.businessMembership.findFirst.mockResolvedValue({ id: 'm1' });
    await expect(service.assertBusinessAccess('u1', 'b1')).resolves.toBeUndefined();
  });
});
