import { AiCreditTxType, AiFeatureCode, ERROR_CODES } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { PrismaService } from '@infra/prisma/prisma.service';

import { AiCreditService } from './ai-credit.service';

function makeWallet(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'wallet-1',
    userId: 'user-1',
    businessId: null,
    balanceCredits: 50,
    periodStart: new Date('2026-08-01T00:00:00.000Z'),
    periodEnd: new Date('2026-09-01T00:00:00.000Z'),
    lifetimeGranted: 50,
    lifetimeSpent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('AiCreditService', () => {
  it('ensureWalletForUser mevcut cüzdanı döner', async () => {
    const wallet = makeWallet();
    const prisma = {
      aiCreditWallet: {
        findUnique: jest.fn().mockResolvedValue(wallet),
      },
    };
    const service = new AiCreditService(prisma as unknown as PrismaService);
    await expect(service.ensureWalletForUser('user-1')).resolves.toEqual(wallet);
  });

  it('debit bakiye düşürür ve usage kaydı oluşturur', async () => {
    const wallet = makeWallet({ balanceCredits: 50 });
    const prisma = {
      aiCreditTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      aiCreditWallet: {
        findUnique: jest.fn().mockResolvedValue(wallet),
        update: jest.fn().mockResolvedValue({ ...wallet, balanceCredits: 48 }),
      },
      subscription: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'sub-1',
          plan: {
            code: 'FREE',
            monthlyCredits: 50,
            features: [{ featureCode: AiFeatureCode.AGENT_CHAT, included: true }],
          },
        }),
      },
      aiFeature: {
        findUnique: jest.fn().mockResolvedValue({
          code: AiFeatureCode.AGENT_CHAT,
          baseCostCredits: 2,
        }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          aiUsageRecord: {
            create: jest.fn().mockResolvedValue({ id: 'usage-1' }),
          },
          aiCreditWallet: {
            update: jest.fn().mockResolvedValue({ ...wallet, balanceCredits: 48 }),
          },
          aiCreditTransaction: {
            create: jest.fn().mockResolvedValue({
              id: 'tx-1',
              amountCredits: 2,
              usageRecordId: 'usage-1',
            }),
          },
        };
        return fn(tx);
      }),
    };

    const service = new AiCreditService(prisma as unknown as PrismaService);
    const result = await service.reserveAndDebit({
      userId: 'user-1',
      featureCode: AiFeatureCode.AGENT_CHAT,
      idempotencyKey: 'key-1',
    });

    expect(result).toEqual({
      transactionId: 'tx-1',
      creditsCharged: 2,
      usageRecordId: 'usage-1',
    });
  });

  it('yetersiz bakiyede AI_CREDITS_EXHAUSTED fırlatır', async () => {
    const wallet = makeWallet({ balanceCredits: 1 });
    const prisma = {
      aiCreditTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      aiCreditWallet: {
        findUnique: jest.fn().mockResolvedValue(wallet),
      },
      subscription: {
        findFirst: jest.fn().mockResolvedValue({
          plan: {
            code: 'FREE',
            features: [{ featureCode: AiFeatureCode.AGENT_CHAT, included: true }],
          },
        }),
      },
      aiFeature: {
        findUnique: jest.fn().mockResolvedValue({
          code: AiFeatureCode.AGENT_CHAT,
          baseCostCredits: 2,
        }),
      },
    };

    const service = new AiCreditService(prisma as unknown as PrismaService);
    await expect(
      service.reserveAndDebit({
        userId: 'user-1',
        featureCode: AiFeatureCode.AGENT_CHAT,
        idempotencyKey: 'key-low',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.AI_CREDITS_EXHAUSTED });
  });

  it('idempotent debit önceki sonucu döner', async () => {
    const prisma = {
      aiCreditTransaction: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tx-old',
          type: AiCreditTxType.DEBIT,
          amountCredits: 2,
          usageRecordId: 'usage-old',
        }),
      },
    };
    const service = new AiCreditService(prisma as unknown as PrismaService);
    const result = await service.reserveAndDebit({
      userId: 'user-1',
      featureCode: AiFeatureCode.AGENT_CHAT,
      idempotencyKey: 'same-key',
    });
    expect(result).toEqual({
      transactionId: 'tx-old',
      creditsCharged: 2,
      usageRecordId: 'usage-old',
    });
  });

  it('plan dışı özellikte AI_FEATURE_NOT_IN_PLAN fırlatır', async () => {
    const wallet = makeWallet();
    const prisma = {
      aiCreditTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      aiCreditWallet: {
        findUnique: jest.fn().mockResolvedValue(wallet),
      },
      subscription: {
        findFirst: jest.fn().mockResolvedValue({
          plan: {
            code: 'FREE',
            features: [],
          },
        }),
      },
    };

    const service = new AiCreditService(prisma as unknown as PrismaService);
    await expect(
      service.reserveAndDebit({
        userId: 'user-1',
        featureCode: AiFeatureCode.DOC_ANALYSIS,
        idempotencyKey: 'key-plan',
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.AI_FEATURE_NOT_IN_PLAN });
  });

  it('refund başarısız AI sonrası bakiyeyi iade eder', async () => {
    const debit = {
      id: 'tx-debit',
      walletId: 'wallet-1',
      type: AiCreditTxType.DEBIT,
      amountCredits: 2,
      usageRecordId: 'usage-1',
      idempotencyKey: 'debit-key',
      featureCode: AiFeatureCode.AGENT_CHAT,
    };

    const prisma = {
      aiCreditTransaction: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(debit)
          .mockResolvedValueOnce(null),
        findFirst: jest.fn(),
      },
      aiUsageRecord: {
        findUnique: jest.fn().mockResolvedValue({ id: 'usage-1', refundedAt: null }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          aiCreditWallet: {
            update: jest.fn().mockResolvedValue({
              ...makeWallet(),
              balanceCredits: 50,
            }),
          },
          aiCreditTransaction: {
            create: jest.fn().mockResolvedValue({
              id: 'tx-refund',
              walletId: 'wallet-1',
              type: AiCreditTxType.REFUND,
              amountCredits: 2,
              balanceAfter: 50,
              featureCode: AiFeatureCode.AGENT_CHAT,
              idempotencyKey: 'refund:debit-key',
              usageRecordId: 'usage-1',
              note: 'fail',
              createdAt: new Date('2026-08-06T00:00:00.000Z'),
            }),
          },
          aiUsageRecord: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return fn(tx);
      }),
    };

    const service = new AiCreditService(prisma as unknown as PrismaService);
    const refund = await service.refund({ idempotencyKey: 'debit-key', reason: 'fail' });
    expect(refund?.type).toBe(AiCreditTxType.REFUND);
    expect(refund?.amountCredits).toBe(2);
  });

  it('refund tekrar çağrıldığında mevcut iadeyi döner', async () => {
    const existingRefund = {
      id: 'tx-refund',
      walletId: 'wallet-1',
      type: AiCreditTxType.REFUND,
      amountCredits: 2,
      balanceAfter: 50,
      featureCode: AiFeatureCode.AGENT_CHAT,
      idempotencyKey: 'refund:debit-key',
      usageRecordId: 'usage-1',
      note: 'fail',
      createdAt: new Date('2026-08-06T00:00:00.000Z'),
    };
    const prisma = {
      aiCreditTransaction: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'tx-debit',
            type: AiCreditTxType.DEBIT,
            amountCredits: 2,
            walletId: 'wallet-1',
            usageRecordId: 'usage-1',
            idempotencyKey: 'debit-key',
            featureCode: AiFeatureCode.AGENT_CHAT,
          })
          .mockResolvedValueOnce(existingRefund),
      },
    };
    const service = new AiCreditService(prisma as unknown as PrismaService);
    const refund = await service.refund({ idempotencyKey: 'debit-key' });
    expect(refund?.id).toBe('tx-refund');
  });

  it('grant anahtarı olmadan refund VALIDATION_ERROR verir', async () => {
    const service = new AiCreditService({} as PrismaService);
    await expect(service.refund({})).rejects.toBeInstanceOf(AppException);
  });
});
