import { JobRequestStatus, OrderStatus, UserRole } from '@ustapilot/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import type { OrderRow } from './order.mapper';
import { OrdersService } from './orders.service';

const CUSTOMER_ID = 'customer-1';
const PROVIDER_USER_ID = 'provider-user-1';
const PROFILE_ID = 'profile-1';
const JOB_ID = '0194a1b2-c3d4-7000-8000-000000000001';
const ORDER_ID = '0194a1b2-c3d4-7000-8000-000000000002';
const WALLET_ID = 'wallet-1';

const customer: AuthenticatedUser = { id: CUSTOMER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const otherCustomer: AuthenticatedUser = {
  id: 'customer-2',
  role: UserRole.CUSTOMER,
  sessionId: 's2',
};
const provider: AuthenticatedUser = {
  id: PROVIDER_USER_ID,
  role: UserRole.PROVIDER,
  sessionId: 's3',
};
const otherProvider: AuthenticatedUser = {
  id: 'provider-user-2',
  role: UserRole.PROVIDER,
  sessionId: 's4',
};
const admin: AuthenticatedUser = { id: 'admin-1', role: UserRole.ADMIN, sessionId: 's5' };

function orderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  const now = new Date('2026-01-10T09:00:00.000Z');

  return {
    id: ORDER_ID,
    jobRequestId: JOB_ID,
    offerId: 'offer-1',
    customerId: CUSTOMER_ID,
    providerProfileId: PROFILE_ID,
    status: OrderStatus.PENDING_PAYMENT,
    totalMinor: 250000,
    commissionMinor: 25000,
    payoutMinor: 225000,
    currency: 'TRY',
    appliedRateBps: 1000,
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    approvedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    jobRequest: {
      id: JOB_ID,
      title: 'Mutfak lavabosu tıkalı',
      status: JobRequestStatus.PROVIDER_SELECTED,
      customerId: CUSTOMER_ID,
      category: { id: 'cat-1', name: 'Tesisat' },
      city: { name: 'Gaziantep' },
      district: { name: 'Şahinbey' },
      neighborhood: null,
      address: { addressLine: 'Atatürk Cad. No: 5' },
      latitude: null,
      longitude: null,
    },
    providerProfile: {
      id: PROFILE_ID,
      userId: PROVIDER_USER_ID,
      businessName: 'Yılmaz Tesisat',
      verificationStatus: 'VERIFIED',
      isPremium: false,
      averageRating: 4.6 as never,
      reviewCount: 24,
      completedJobCount: 58,
      averageResponseMinutes: 35,
      user: { fullName: 'Ahmet Yılmaz', avatar: null },
      services: [{ category: { id: 'cat-1', name: 'Tesisat' } }],
    },
    customer: { id: CUSTOMER_ID, fullName: 'Ayşe Demir', avatar: null },
    ...overrides,
  };
}

type PrismaMock = {
  order: { findFirst: jest.Mock; findMany: jest.Mock; count: jest.Mock; update: jest.Mock };
  jobRequest: { update: jest.Mock };
  jobStatusHistory: { create: jest.Mock };
  providerProfile: { findFirst: jest.Mock; update: jest.Mock };
  customerProfile: { updateMany: jest.Mock };
  providerWallet: { upsert: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  payment: { create: jest.Mock; findUnique: jest.Mock };
  transaction: { create: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    order: {
      findFirst: jest.fn().mockResolvedValue(orderRow()),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(orderRow()),
    },
    jobRequest: { update: jest.fn().mockResolvedValue({}) },
    jobStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    providerProfile: {
      findFirst: jest.fn().mockResolvedValue({ id: PROFILE_ID }),
      update: jest.fn().mockResolvedValue({}),
    },
    customerProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    providerWallet: {
      upsert: jest.fn().mockResolvedValue({ id: WALLET_ID, balanceMinor: 0 }),
      update: jest.fn().mockResolvedValue({ id: WALLET_ID, balanceMinor: 225000 }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    payment: {
      create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    transaction: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };

  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));

  return mock;
}

function createService(prisma: PrismaMock): OrdersService {
  const config = {
    fileBaseUrl: 'http://localhost:9000/ustapilot',
  } as unknown as AppConfigService;

  return new OrdersService(prisma as unknown as PrismaService, config);
}

/** `skip` ve `toOrderBy` prototip üzerinde olduğundan gerçek DTO örneği kurulur. */
function listQuery(overrides: Record<string, unknown> = {}): ListOrdersQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

/** Mock çağrı argümanı `any` olduğundan okumadan önce beklenen şekle daraltılır. */
function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
}

type OrderUpdateData = {
  status: OrderStatus;
  startedAt?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string | null;
  scheduledAt?: Date;
};

async function codeOfRejection(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

describe('OrdersService', () => {
  let prisma: PrismaMock;
  let service: OrdersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  describe('ödeme', () => {
    it('siparişi ödendi durumuna taşır ve tahsilat kaydı açar', async () => {
      await service.pay(customer, ORDER_ID, {});

      const { data } = firstCallArg<{ data: OrderUpdateData }>(prisma.order.update);
      expect(data.status).toBe(OrderStatus.PAID);
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('hakedişi ustanın cüzdanında bloke eder', async () => {
      await service.pay(customer, ORDER_ID, {});

      const args = firstCallArg<{ update: { pendingMinor: { increment: number } } }>(
        prisma.providerWallet.upsert,
      );
      expect(args.update.pendingMinor.increment).toBe(225000);
    });

    it('işi takvime alınmış duruma geçirir', async () => {
      await service.pay(customer, ORDER_ID, {});

      const { data } = firstCallArg<{ data: { status: JobRequestStatus } }>(
        prisma.jobRequest.update,
      );
      expect(data.status).toBe(JobRequestStatus.SCHEDULED);
      expect(prisma.jobStatusHistory.create).toHaveBeenCalled();
    });

    it('aynı ödeme anahtarıyla gelen tekrar isteğinde ikinci tahsilat yapmaz', async () => {
      // Tekrar isteği ilk ödeme tamamlandıktan sonra gelir; sipariş artık ödenmiştir.
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.PAID }));
      prisma.payment.findUnique.mockResolvedValue({ orderId: ORDER_ID });

      const order = await service.pay(customer, ORDER_ID, { idempotencyKey: 'key-1' });

      expect(order.status).toBe(OrderStatus.PAID);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('başka siparişe ait ödeme anahtarını reddeder', async () => {
      prisma.payment.findUnique.mockResolvedValue({ orderId: 'order-9' });

      await expect(
        codeOfRejection(() => service.pay(customer, ORDER_ID, { idempotencyKey: 'key-1' })),
      ).resolves.toBe('PAYMENT_ALREADY_PROCESSED');
    });

    it('ödenmiş siparişi tekrar ödetmez', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.PAID }));

      await expect(codeOfRejection(() => service.pay(customer, ORDER_ID, {}))).resolves.toBe(
        'ORDER_INVALID_STATUS_TRANSITION',
      );
    });

    it('başkasının siparişini ödetmez', async () => {
      await expect(codeOfRejection(() => service.pay(otherCustomer, ORDER_ID, {}))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('işe başlama', () => {
    it('ödenmiş siparişi devam ediyor durumuna taşır', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRow({ status: OrderStatus.PAID, jobRequest: jobAt(JobRequestStatus.SCHEDULED) }),
      );

      await service.start(provider, ORDER_ID);

      const { data } = firstCallArg<{ data: OrderUpdateData }>(prisma.order.update);
      expect(data.status).toBe(OrderStatus.IN_PROGRESS);
      expect(data.startedAt).toBeInstanceOf(Date);
    });

    it('ödenmemiş siparişte işe başlatmaz', async () => {
      await expect(codeOfRejection(() => service.start(provider, ORDER_ID))).resolves.toBe(
        'ORDER_INVALID_STATUS_TRANSITION',
      );
    });

    it('başka ustanın siparişini başlatmaz', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.PAID }));

      await expect(codeOfRejection(() => service.start(otherProvider, ORDER_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('tamamlama ve onay', () => {
    it('usta işi onaya gönderir', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRow({
          status: OrderStatus.IN_PROGRESS,
          jobRequest: jobAt(JobRequestStatus.IN_PROGRESS),
        }),
      );

      await service.complete(provider, ORDER_ID, {});

      const { data } = firstCallArg<{ data: OrderUpdateData }>(prisma.order.update);
      expect(data.status).toBe(OrderStatus.AWAITING_APPROVAL);
      expect(data.completedAt).toBeInstanceOf(Date);
    });

    it('onayda hakedişi kullanılabilir bakiyeye geçirir', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRow({
          status: OrderStatus.AWAITING_APPROVAL,
          jobRequest: jobAt(JobRequestStatus.AWAITING_CUSTOMER_APPROVAL),
        }),
      );

      await service.approve(customer, ORDER_ID);

      const args = firstCallArg<{
        data: { pendingMinor: { decrement: number }; balanceMinor: { increment: number } };
      }>(prisma.providerWallet.update);
      expect(args.data.pendingMinor.decrement).toBe(225000);
      expect(args.data.balanceMinor.increment).toBe(225000);
    });

    it('onayda tamamlanan iş sayaçlarını artırır', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRow({
          status: OrderStatus.AWAITING_APPROVAL,
          jobRequest: jobAt(JobRequestStatus.AWAITING_CUSTOMER_APPROVAL),
        }),
      );

      await service.approve(customer, ORDER_ID);

      expect(prisma.providerProfile.update).toHaveBeenCalled();
      expect(prisma.customerProfile.updateMany).toHaveBeenCalled();
    });

    it('onay beklemeyen siparişi onaylatmaz', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.PAID }));

      await expect(codeOfRejection(() => service.approve(customer, ORDER_ID))).resolves.toBe(
        'ORDER_INVALID_STATUS_TRANSITION',
      );
    });

    it('ustanın kendi işini onaylamasını engeller', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.AWAITING_APPROVAL }));

      await expect(codeOfRejection(() => service.approve(provider, ORDER_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('iptal', () => {
    it('ödeme öncesi müşteri iptal edebilir', async () => {
      await service.cancel(customer, ORDER_ID, { reason: 'Vazgeçtim' });

      const { data } = firstCallArg<{ data: OrderUpdateData }>(prisma.order.update);
      expect(data.status).toBe(OrderStatus.CANCELLED);
      expect(data.cancellationReason).toBe('Vazgeçtim');
    });

    it('üstlenen usta da iptal edebilir', async () => {
      await service.cancel(provider, ORDER_ID, {});

      const { data } = firstCallArg<{ data: OrderUpdateData }>(prisma.order.update);
      expect(data.status).toBe(OrderStatus.CANCELLED);
    });

    it('ödenmiş siparişte bloke hakedişi geri alır', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRow({ status: OrderStatus.PAID, jobRequest: jobAt(JobRequestStatus.SCHEDULED) }),
      );

      await service.cancel(customer, ORDER_ID, {});

      expect(prisma.providerWallet.updateMany).toHaveBeenCalled();
    });

    it('iş başladıktan sonra iptal ettirmez', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.IN_PROGRESS }));

      await expect(codeOfRejection(() => service.cancel(customer, ORDER_ID, {}))).resolves.toBe(
        'ORDER_INVALID_STATUS_TRANSITION',
      );
    });

    it('ilgisiz kullanıcı iptal edemez', async () => {
      await expect(
        codeOfRejection(() => service.cancel(otherCustomer, ORDER_ID, {})),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });

    it('personel taraf adına iptal edemez', async () => {
      await expect(codeOfRejection(() => service.cancel(admin, ORDER_ID, {}))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('listeleme ve görüntüleme', () => {
    it('müşteriye yalnızca kendi siparişlerini sorgular', async () => {
      await service.listMine(customer, listQuery());

      const { where } = firstCallArg<{ where: { customerId?: string } }>(prisma.order.findMany);
      expect(where.customerId).toBe(CUSTOMER_ID);
    });

    it('ustaya üstlendiği işleri sorgular', async () => {
      await service.listMine(provider, listQuery());

      const { where } = firstCallArg<{ where: { providerProfileId?: string } }>(
        prisma.order.findMany,
      );
      expect(where.providerProfileId).toBe(PROFILE_ID);
    });

    it('personele taraf süzgeci uygulamaz', async () => {
      await service.listMine(admin, listQuery());

      const { where } = firstCallArg<{
        where: { customerId?: string; providerProfileId?: string };
      }>(prisma.order.findMany);
      expect(where.customerId).toBeUndefined();
      expect(where.providerProfileId).toBeUndefined();
    });

    it('taraflara açık adresi gösterir', async () => {
      const order = await service.getById(customer, ORDER_ID);

      expect(order.job?.address.isFullyVisible).toBe(true);
      expect(order.job?.address.addressLine).toBe('Atatürk Cad. No: 5');
    });

    it('ilgisiz kullanıcıya siparişi göstermez', async () => {
      await expect(codeOfRejection(() => service.getById(otherCustomer, ORDER_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });

    it('bulunamayan siparişte 404 üretir', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.getById(customer, ORDER_ID))).resolves.toBe(
        'NOT_FOUND',
      );
    });
  });
});

/** Sipariş adımlarında işin beklenen durumunu kurar. */
function jobAt(status: JobRequestStatus): OrderRow['jobRequest'] {
  return { ...orderRow().jobRequest, status };
}
