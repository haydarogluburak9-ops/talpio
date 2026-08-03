import { createHmac } from 'node:crypto';

import { OrderStatus, PaymentStatus, UserRole } from '@ustapilot/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import { MockPaymentProvider } from '@infra/payments/mock-payment.provider';
import type { PaymentProvider } from '@infra/payments/payment-provider';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { ListPaymentsQueryDto, ListTransactionsQueryDto } from './dto/list-payments-query.dto';
import { PaymentsService } from './payments.service';

const CUSTOMER_ID = 'customer-1';
const PROVIDER_USER_ID = 'provider-user-1';
const PROFILE_ID = 'profile-1';
const ORDER_ID = '0194a1b2-c3d4-7000-8000-000000000002';
const PAYMENT_ID = '0194a1b2-c3d4-7000-8000-000000000003';
const WEBHOOK_SECRET = 'duman-testi-webhook-anahtari';

const customer: AuthenticatedUser = { id: CUSTOMER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const provider: AuthenticatedUser = {
  id: PROVIDER_USER_ID,
  role: UserRole.PROVIDER,
  sessionId: 's2',
};
const admin: AuthenticatedUser = { id: 'admin-1', role: UserRole.ADMIN, sessionId: 's3' };
const support: AuthenticatedUser = { id: 'support-1', role: UserRole.SUPPORT, sessionId: 's4' };

function paymentRow(overrides: Record<string, unknown> = {}) {
  const now = new Date('2026-02-01T10:00:00.000Z');

  return {
    id: PAYMENT_ID,
    orderId: ORDER_ID,
    status: PaymentStatus.CAPTURED,
    amountMinor: 250000,
    currency: 'TRY',
    providerName: 'mock',
    providerReference: 'mock_ref_1',
    idempotencyKey: null,
    authorizedAt: now,
    capturedAt: now,
    refundedAt: null,
    failureReason: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function orderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    status: OrderStatus.PAID,
    currency: 'TRY',
    payoutMinor: 225000,
    commissionMinor: 25000,
    providerProfileId: PROFILE_ID,
    jobRequestId: 'job-1',
    jobRequest: { status: 'SCHEDULED' },
    ...overrides,
  };
}

type PrismaMock = {
  payment: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  transaction: { findMany: jest.Mock; count: jest.Mock; create: jest.Mock };
  order: { findUnique: jest.Mock; update: jest.Mock };
  providerWallet: { findUnique: jest.Mock; updateMany: jest.Mock };
  providerProfile: { findFirst: jest.Mock };
  jobRequest: { update: jest.Mock };
  jobStatusHistory: { create: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    payment: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue(paymentRow({ status: PaymentStatus.REFUNDED })),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(paymentRow()),
    },
    transaction: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({}),
    },
    order: {
      findUnique: jest.fn().mockResolvedValue(orderRow()),
      update: jest.fn().mockResolvedValue({}),
    },
    providerWallet: {
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    providerProfile: { findFirst: jest.fn().mockResolvedValue({ id: PROFILE_ID }) },
    jobRequest: { update: jest.fn().mockResolvedValue({}) },
    jobStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };

  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));

  return mock;
}

function createConfig(): AppConfigService {
  return {
    payment: { driver: 'mock', currency: 'TRY', webhookSecret: WEBHOOK_SECRET },
  } as unknown as AppConfigService;
}

function createService(prisma: PrismaMock, paymentProvider?: PaymentProvider): PaymentsService {
  const config = createConfig();
  const audit = { record: jest.fn() } as unknown as AuditLogService;

  return new PaymentsService(
    prisma as unknown as PrismaService,
    config,
    audit,
    paymentProvider ?? new MockPaymentProvider(config),
  );
}

function listQuery(overrides: Record<string, unknown> = {}): ListPaymentsQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

function transactionQuery(overrides: Record<string, unknown> = {}): ListTransactionsQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
}

/** Sağlayıcının imzaladığı gövdeyi taklit eder. */
function signedWebhook(body: Record<string, unknown>) {
  const rawBody = Buffer.from(JSON.stringify(body), 'utf8');
  const signature = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

  return { headers: { 'x-ustapilot-signature': signature }, rawBody };
}

async function codeOfRejection(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

describe('PaymentsService', () => {
  let prisma: PrismaMock;
  let service: PaymentsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  describe('sağlayıcı çağrısı', () => {
    it('provizyon ve tahsilatı sırayla yürütür', async () => {
      const outcome = await service.charge({
        orderId: ORDER_ID,
        amountMinor: 250000,
        currency: 'TRY',
        idempotencyKey: null,
      });

      expect(outcome.status).toBe(PaymentStatus.CAPTURED);
      expect(outcome.providerReference).toMatch(/^mock_/);
    });

    it('tetikleyici tutarda başarısız sonuç döner', async () => {
      const outcome = await service.charge({
        orderId: ORDER_ID,
        amountMinor: 200013,
        currency: 'TRY',
        idempotencyKey: null,
      });

      expect(outcome.status).toBe(PaymentStatus.FAILED);
      expect(outcome.failureReason).toBeTruthy();
    });
  });

  describe('listeleme kapsamı', () => {
    it('müşteriye yalnızca kendi ödemelerini sorgular', async () => {
      await service.listMine(customer, listQuery());

      const { where } = firstCallArg<{ where: { order?: { customerId?: string } } }>(
        prisma.payment.findMany,
      );
      expect(where.order?.customerId).toBe(CUSTOMER_ID);
    });

    it('ustaya üstlendiği siparişlerin ödemelerini sorgular', async () => {
      await service.listMine(provider, listQuery());

      const { where } = firstCallArg<{ where: { order?: { providerProfileId?: string } } }>(
        prisma.payment.findMany,
      );
      expect(where.order?.providerProfileId).toBe(PROFILE_ID);
    });

    it('personele taraf süzgeci uygulamaz', async () => {
      await service.listMine(admin, listQuery());

      const { where } = firstCallArg<{ where: { order?: unknown } }>(prisma.payment.findMany);
      expect(where.order).toBeUndefined();
    });

    it('müşteriye komisyon ve hakediş hareketlerini göstermez', async () => {
      await service.listTransactions(customer, transactionQuery());

      const { where } = firstCallArg<{ where: { type?: { in: string[] } } }>(
        prisma.transaction.findMany,
      );
      expect(where.type?.in).toEqual(['PAYMENT', 'REFUND']);
    });

    it('ustaya cüzdan hareketlerini sorgular', async () => {
      await service.listTransactions(provider, transactionQuery());

      const { where } = firstCallArg<{ where: { OR?: unknown[] } }>(prisma.transaction.findMany);
      expect(where.OR).toHaveLength(2);
    });
  });

  describe('görüntüleme yetkisi', () => {
    beforeEach(() => {
      prisma.payment.findUnique.mockResolvedValue({
        ...paymentRow(),
        order: { customerId: CUSTOMER_ID, providerProfile: { userId: PROVIDER_USER_ID } },
      });
    });

    it('ödemeyi yapan müşteri görebilir', async () => {
      await expect(service.getById(customer, PAYMENT_ID)).resolves.toMatchObject({
        id: PAYMENT_ID,
      });
    });

    it('ilgisiz kullanıcıya göstermez', async () => {
      const stranger: AuthenticatedUser = {
        id: 'customer-9',
        role: UserRole.CUSTOMER,
        sessionId: 's9',
      };

      await expect(codeOfRejection(() => service.getById(stranger, PAYMENT_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('cüzdan özeti', () => {
    it('cüzdanı olmayan ustaya sıfır bakiye döner', async () => {
      const summary = await service.walletSummary(provider);

      expect(summary.balance.amountMinor).toBe(0);
      expect(summary.pending.amountMinor).toBe(0);
      expect(summary.balance.currency).toBe('TRY');
    });

    it('bloke hakedişi ayrı gösterir', async () => {
      prisma.providerWallet.findUnique.mockResolvedValue({
        balanceMinor: 100000,
        pendingMinor: 225000,
        currency: 'TRY',
      });

      const summary = await service.walletSummary(provider);

      expect(summary.balance.amountMinor).toBe(100000);
      expect(summary.pending.amountMinor).toBe(225000);
    });
  });

  describe('webhook', () => {
    it('imzasız isteği reddeder', async () => {
      await expect(
        codeOfRejection(() =>
          service.handleWebhook({
            headers: {},
            rawBody: Buffer.from('{"type":"payment.captured"}', 'utf8'),
          }),
        ),
      ).resolves.toBe('PAYMENT_WEBHOOK_INVALID');
    });

    it('yanlış imzalı isteği reddeder', async () => {
      const request = signedWebhook({ type: 'payment.captured', providerReference: 'mock_ref_1' });

      await expect(
        codeOfRejection(() =>
          service.handleWebhook({
            headers: { 'x-ustapilot-signature': 'a'.repeat(64) },
            rawBody: request.rawBody,
          }),
        ),
      ).resolves.toBe('PAYMENT_WEBHOOK_INVALID');
    });

    it('bekleyen ödemeyi tahsil edilmiş yapar', async () => {
      prisma.payment.findFirst.mockResolvedValue(paymentRow({ status: PaymentStatus.AUTHORIZED }));

      const result = await service.handleWebhook(
        signedWebhook({
          eventId: 'evt-1',
          type: 'payment.captured',
          providerReference: 'mock_ref_1',
        }),
      );

      expect(result.applied).toBe(true);
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('aynı olay ikinci kez geldiğinde muhasebe hareketi yazmaz', async () => {
      prisma.payment.findFirst.mockResolvedValue(paymentRow({ status: PaymentStatus.CAPTURED }));

      const result = await service.handleWebhook(
        signedWebhook({
          eventId: 'evt-1',
          type: 'payment.captured',
          providerReference: 'mock_ref_1',
        }),
      );

      expect(result.applied).toBe(false);
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('eşleşen ödeme yoksa isteği yutar', async () => {
      const result = await service.handleWebhook(
        signedWebhook({ type: 'payment.captured', providerReference: 'bilinmeyen' }),
      );

      expect(result.applied).toBe(false);
    });

    it('iade olayında ters kayıt yazar', async () => {
      prisma.payment.findFirst.mockResolvedValue(paymentRow());

      const result = await service.handleWebhook(
        signedWebhook({ type: 'payment.refunded', providerReference: 'mock_ref_1' }),
      );

      expect(result.applied).toBe(true);

      const { data } = firstCallArg<{ data: { amountMinor: number; type: string } }>(
        prisma.transaction.create,
      );
      expect(data.amountMinor).toBe(-250000);
      expect(data.type).toBe('REFUND');
    });
  });

  describe('personel iadesi', () => {
    beforeEach(() => {
      prisma.payment.findUnique.mockResolvedValue({ ...paymentRow(), order: orderRow() });
    });

    it('tahsil edilmiş ödemeyi iade eder', async () => {
      const refunded = await service.refund(admin, PAYMENT_ID, { reason: 'Usta gelmedi' });

      expect(refunded.status).toBe(PaymentStatus.REFUNDED);
      expect(prisma.providerWallet.updateMany).toHaveBeenCalled();
    });

    it('iptal edilmiş siparişin ödemesini yeniden iade etmez', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...paymentRow({ status: PaymentStatus.REFUNDED }),
        order: orderRow(),
      });

      await expect(codeOfRejection(() => service.refund(admin, PAYMENT_ID, {}))).resolves.toBe(
        'PAYMENT_NOT_REFUNDABLE',
      );
    });

    it('onaylanmış işin ödemesini iade etmez', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        ...paymentRow(),
        order: orderRow({ status: OrderStatus.COMPLETED }),
      });

      await expect(codeOfRejection(() => service.refund(admin, PAYMENT_ID, {}))).resolves.toBe(
        'PAYMENT_NOT_REFUNDABLE',
      );
    });

    it('bulunamayan ödemede 404 üretir', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.refund(support, PAYMENT_ID, {}))).resolves.toBe(
        'NOT_FOUND',
      );
    });
  });
});
