import { Permission, RequestOfferStatus, RequestStatus, UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';

import { RequestsService } from './requests.service';

describe('RequestsService tenant isolation', () => {
  const prisma: Record<string, unknown> = {
    commerceRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    requestMatch: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      upsert: jest.fn(),
      groupBy: jest.fn(),
    },
    requestOffer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    userBlock: { findMany: jest.fn() },
    business: { findMany: jest.fn(), findFirst: jest.fn() },
    commissionRule: { findMany: jest.fn() },
    order: { create: jest.fn() },
    requestOrderLink: { create: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  prisma.$transaction = jest.fn((fn: unknown) => {
    if (typeof fn === 'function') {
      return (fn as (tx: typeof prisma) => unknown)(prisma);
    }
    return Promise.all(fn as never);
  });

  const rbac = {
    getEffectivePermissions: jest.fn(),
    assertBusinessAccess: jest.fn(),
  };
  const notifications = { dispatch: jest.fn() };
  const outbox = { write: jest.fn() };
  const audit = { record: jest.fn() };

  const service = new RequestsService(
    prisma as never,
    rbac as never,
    notifications as never,
    outbox as never,
    audit as never,
  );

  const commerceRequest = prisma.commerceRequest as {
    findFirst: jest.Mock;
  };
  const requestMatch = prisma.requestMatch as { findFirst: jest.Mock };
  const requestOffer = prisma.requestOffer as {
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  const commissionRule = prisma.commissionRule as { findMany: jest.Mock };
  const order = prisma.order as { create: jest.Mock };
  const requestOrderLink = prisma.requestOrderLink as { create: jest.Mock };
  const user = prisma.user as { findUnique: jest.Mock };

  beforeEach(() => jest.clearAllMocks());

  it('alıcı A, alıcı B talebini göremez', async () => {
    commerceRequest.findFirst.mockResolvedValue({
      id: 'req-b',
      buyerUserId: 'buyer-b',
      deletedAt: null,
    });
    requestMatch.findFirst.mockResolvedValue(null);

    await expect(
      service.getById(
        {
          id: 'buyer-a',
          role: UserRole.CUSTOMER,
          sessionId: 's',
          permissionCodes: [Permission.REQUEST_READ_OWN],
          businessIds: [],
        },
        'req-b',
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('accept Order + RequestOrderLink oluşturur', async () => {
    requestOffer.findFirst.mockResolvedValue({
      id: 'offer-1',
      requestId: 'req-1',
      businessId: 'biz-1',
      status: RequestOfferStatus.SUBMITTED,
      amountMinor: 100_000,
      currency: 'TRY',
      validUntil: new Date(Date.now() + 86_400_000),
      deliveryDays: 3,
      shippingIncluded: true,
      locationText: 'İstanbul / Pendik',
      note: null,
      createdByUserId: 'supplier-1',
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      request: {
        id: 'req-1',
        buyerUserId: 'buyer-a',
        title: 'Motor yağı',
        categoryId: 'cat-1',
        deliveryCityId: 'city-1',
        status: RequestStatus.QUOTING,
      },
      business: {
        id: 'biz-1',
        name: 'Yağ A.Ş.',
        providerProfileId: 'pp-1',
        providerProfile: { id: 'pp-1', isPremium: false, userId: 'supplier-1' },
      },
    });
    commissionRule.findMany.mockResolvedValue([]);
    requestOffer.update.mockResolvedValue({
      id: 'offer-1',
      requestId: 'req-1',
      businessId: 'biz-1',
      createdByUserId: 'supplier-1',
      status: RequestOfferStatus.ACCEPTED,
      amountMinor: 100_000,
      currency: 'TRY',
      deliveryDays: 3,
      shippingIncluded: true,
      locationText: 'İstanbul / Pendik',
      note: null,
      validUntil: new Date(Date.now() + 86_400_000),
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
    order.create.mockResolvedValue({ id: 'order-1' });
    requestOrderLink.create.mockResolvedValue({ id: 'link-1' });
    user.findUnique.mockResolvedValue({ fullName: 'Alıcı A' });

    const result = await service.acceptOffer(
      {
        id: 'buyer-a',
        role: UserRole.CUSTOMER,
        sessionId: 's',
        permissionCodes: [Permission.REQUEST_OFFER_ACCEPT],
      },
      'offer-1',
    );

    expect(result.orderId).toBe('order-1');
    expect(order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobRequestId: null,
          offerId: null,
          source: 'COMMERCE_REQUEST',
          providerProfileId: 'pp-1',
        }),
      }),
    );
    expect(requestOrderLink.create).toHaveBeenCalledWith({
      data: { requestOfferId: 'offer-1', orderId: 'order-1' },
    });
  });
});
