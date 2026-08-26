import { REQUEST_MATCHING } from '@talpio/config';
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

  const business = prisma.business as { findMany: jest.Mock };
  const userBlock = prisma.userBlock as { findMany: jest.Mock };
  const requestMatchMocks = prisma.requestMatch as {
    deleteMany: jest.Mock;
    upsert: jest.Mock;
    groupBy: jest.Mock;
  };
  const requestOfferMocks = prisma.requestOffer as { groupBy: jest.Mock };
  const commerceRequestMocks = prisma.commerceRequest as { update: jest.Mock };

  const buyer = {
    id: 'buyer-a',
    role: UserRole.CUSTOMER,
    sessionId: 's',
    permissionCodes: [Permission.REQUEST_UPDATE_OWN],
    businessIds: [],
  };

  function draftRow(overrides: Record<string, unknown> = {}) {
    const now = new Date('2026-08-01T10:00:00.000Z');
    return {
      id: 'req-1',
      requestType: 'PRODUCT_SUPPLY',
      title: 'Motor yağı tedariki',
      description: 'Akıştan oluşturulan talep açıklaması',
      categoryId: 'cat-1',
      subcategoryId: null,
      quantity: null,
      unit: null,
      specifications: { sourcePostId: 'post-1' },
      budgetMinor: 9900,
      currency: 'TRY',
      deliveryCityId: null,
      deliveryDistrictId: null,
      deliveryAddressText: null,
      deliveryDeadline: null,
      visibility: 'PUBLIC_MATCHED',
      buyerUserId: 'buyer-a',
      businessId: null,
      status: RequestStatus.DRAFT,
      source: 'WEB',
      aiClassification: null,
      aiConfidence: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      category: { slug: 'motor-yagi', name: 'Motor yağı' },
      deliveryCity: null,
      ...overrides,
    };
  }

  function matcherBusiness(overrides: Record<string, unknown> = {}) {
    return {
      id: 'biz-1',
      isActive: true,
      verificationStatus: 'VERIFIED',
      minOrderQuantity: null,
      maxOrderQuantity: null,
      categories: [{ categoryId: 'cat-1' }],
      serviceAreas: [],
      memberships: [{ userId: 'seller-1', user: { lastActiveAt: null } }],
      providerProfile: null,
      ...overrides,
    };
  }

  function primePublish(businesses: unknown[]) {
    userBlock.findMany.mockResolvedValue([]);
    requestOfferMocks.groupBy.mockResolvedValue([]);
    requestMatchMocks.groupBy.mockResolvedValue([]);
    requestMatchMocks.deleteMany.mockResolvedValue({ count: 0 });
    requestMatchMocks.upsert.mockResolvedValue({});
    business.findMany.mockResolvedValue(businesses);
    outbox.write.mockResolvedValue(undefined);
    audit.record.mockResolvedValue(undefined);
  }

  beforeEach(() => jest.clearAllMocks());

  it('publish eşleşen işletmenin üyelerine outbox olayı yazar ve matchCount döner', async () => {
    const row = draftRow();
    commerceRequest.findFirst.mockResolvedValue(row);
    primePublish([matcherBusiness(), matcherBusiness({ id: 'biz-2' })]);
    commerceRequestMocks.update.mockResolvedValue({
      ...row,
      status: RequestStatus.MATCHING,
      publishedAt: new Date(),
    });

    const published = await service.publish(buyer, 'req-1');

    expect(published.status).toBe(RequestStatus.MATCHING);
    expect(published.matchCount).toBe(2);
    expect(requestMatchMocks.upsert).toHaveBeenCalledTimes(2);
    expect(outbox.write).toHaveBeenCalledTimes(1);
    expect(outbox.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'request.matched',
        idempotencyKey: 'request.matched:req-1:seller-1',
      }),
    );
  });

  it('publish sıfır eşleşmede talebi yayında bırakır, matchCount 0 döner', async () => {
    const row = draftRow();
    commerceRequest.findFirst.mockResolvedValue(row);
    primePublish([matcherBusiness({ categories: [{ categoryId: 'cat-other' }] })]);
    commerceRequestMocks.update.mockResolvedValue({
      ...row,
      status: RequestStatus.MATCHING,
      publishedAt: new Date(),
    });

    const published = await service.publish(buyer, 'req-1');

    expect(published.status).toBe(RequestStatus.MATCHING);
    expect(published.matchCount).toBe(0);
    expect(requestMatchMocks.upsert).not.toHaveBeenCalled();
    expect(outbox.write).not.toHaveBeenCalled();
  });

  it('publish kategorisiz talepte eşleşmeyi dar üst sınıra kırpar', async () => {
    const row = draftRow({ categoryId: null, category: null });
    commerceRequest.findFirst.mockResolvedValue(row);
    primePublish(
      Array.from({ length: REQUEST_MATCHING.maxMatchesWithoutCategory + 20 }, (_, i) =>
        matcherBusiness({
          id: `biz-${i}`,
          memberships: [{ userId: `seller-${i}`, user: { lastActiveAt: null } }],
        }),
      ),
    );
    commerceRequestMocks.update.mockResolvedValue({
      ...row,
      status: RequestStatus.MATCHING,
      publishedAt: new Date(),
    });

    const published = await service.publish(buyer, 'req-1');

    expect(published.matchCount).toBe(REQUEST_MATCHING.maxMatchesWithoutCategory);
    expect(outbox.write).toHaveBeenCalledTimes(REQUEST_MATCHING.maxMatchesWithoutCategory);
  });

  it('publish kategorili talepte dar sınırı uygulamaz', async () => {
    const row = draftRow();
    commerceRequest.findFirst.mockResolvedValue(row);
    primePublish(
      Array.from({ length: REQUEST_MATCHING.maxMatchesWithoutCategory + 5 }, (_, i) =>
        matcherBusiness({
          id: `biz-${i}`,
          memberships: [{ userId: `seller-${i}`, user: { lastActiveAt: null } }],
        }),
      ),
    );
    commerceRequestMocks.update.mockResolvedValue({
      ...row,
      status: RequestStatus.MATCHING,
      publishedAt: new Date(),
    });

    const published = await service.publish(buyer, 'req-1');

    expect(published.matchCount).toBe(REQUEST_MATCHING.maxMatchesWithoutCategory + 5);
  });

  it('getById alıcıya eşleşme sayısını döner', async () => {
    commerceRequest.findFirst.mockResolvedValue({
      ...draftRow({ status: RequestStatus.MATCHING }),
      _count: { matches: 5 },
    });

    const found = await service.getById(buyer, 'req-1');

    expect(found.matchCount).toBe(5);
  });

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
