import { CrmCustomerSource, WorkOrderSource, WorkOrderStage } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { currencyDouble } from '@infra/currency/currency.test-double';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { RbacService } from '@modules/rbac/rbac.service';

import { BusinessOpsService } from './ops.service';

const USER: AuthenticatedUser = { id: 'user-a', role: 'PROVIDER', sessionId: 's1' };

describe('BusinessOpsService tenant isolation', () => {
  it('CRM listesini assertBusinessAccess sonrası tenantId ile çeker', async () => {
    const assertBusinessAccess = jest.fn().mockResolvedValue(undefined);
    const findMany = jest.fn().mockResolvedValue([]);
    const service = new BusinessOpsService(
      { crmCustomer: { findMany } } as unknown as PrismaService,
      { assertBusinessAccess } as unknown as RbacService,
      { record: jest.fn() } as never,
      currencyDouble(),
    );

    await service.listCrmCustomers(USER, 'biz-a');

    expect(assertBusinessAccess).toHaveBeenCalledWith('user-a', 'biz-a');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'biz-a', deletedAt: null },
      }),
    );
  });

  it('başka işletmenin müşterisine not yazmaz', async () => {
    const service = new BusinessOpsService(
      {
        crmCustomer: { findFirst: jest.fn().mockResolvedValue(null) },
      } as unknown as PrismaService,
      { assertBusinessAccess: jest.fn().mockResolvedValue(undefined) } as unknown as RbacService,
      { record: jest.fn() } as never,
      currencyDouble(),
    );

    await expect(service.addCrmNote(USER, 'biz-a', 'cust-x', 'not')).rejects.toBeInstanceOf(
      AppException,
    );
  });

  it('iş emri varsayılanı NEW / OTHER dış kaynak', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'wo-1',
      tenantId: 'biz-a',
      customerId: 'cust-1',
      source: WorkOrderSource.OTHER,
      stage: WorkOrderStage.NEW,
      title: 'Keşif',
      notes: null,
      scheduledAt: null,
      assignedUserId: null,
      marketplaceOrderId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: 'cust-1', displayName: 'Ali' },
    });
    const service = new BusinessOpsService(
      {
        crmCustomer: { findFirst: jest.fn().mockResolvedValue({ id: 'cust-1' }) },
        workOrder: { create },
      } as unknown as PrismaService,
      { assertBusinessAccess: jest.fn().mockResolvedValue(undefined) } as unknown as RbacService,
      { record: jest.fn() } as never,
      currencyDouble(),
    );

    await service.createWorkOrder(USER, 'biz-a', {
      customerId: 'cust-1',
      title: 'Keşif',
      source: WorkOrderSource.PHONE,
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'biz-a',
          customerId: 'cust-1',
          source: WorkOrderSource.PHONE,
        }),
      }),
    );
    expect(CrmCustomerSource.TALPIO).toBe('TALPIO');
  });

  it('takip kaydı tenant müşterisine yazılır', async () => {
    const create = jest.fn().mockResolvedValue({
      id: 'fu-1',
      dueAt: new Date('2026-08-14T00:00:00Z'),
      body: 'Ara',
      completedAt: null,
    });
    const service = new BusinessOpsService(
      {
        crmCustomer: {
          findFirst: jest.fn().mockResolvedValue({ id: 'cust-1' }),
          update: jest.fn(),
        },
        crmFollowUp: { create },
      } as unknown as PrismaService,
      { assertBusinessAccess: jest.fn().mockResolvedValue(undefined) } as unknown as RbacService,
      { record: jest.fn() } as never,
      currencyDouble(),
    );

    await service.addCrmFollowUp(USER, 'biz-a', 'cust-1', {
      dueAt: '2026-08-14T00:00:00.000Z',
      body: 'Ara',
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ customerId: 'cust-1', body: 'Ara' }),
      }),
    );
  });
});
