import { Injectable } from '@nestjs/common';
import { estimateCredits } from '@talpio/business-logic';
import { MONETIZATION } from '@talpio/config';
import {
  AiCreditTxType,
  AiFeatureCode,
  SubscriptionPlanCode,
  type AiCreditTransaction,
  type AiCreditWalletSummary,
  type AiUsageRecordView,
  type SubscriptionPlan,
} from '@talpio/types';

import type { AiFeatureCode as PrismaAiFeatureCode, Prisma } from '@/generated/prisma/client';
import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';

export interface ReserveAndDebitInput {
  userId: string;
  businessId?: string | null;
  featureCode: AiFeatureCode;
  idempotencyKey: string;
  estimatedCredits?: number;
  metadata?: {
    tenantId?: string | null;
    provider?: string;
    model?: string | null;
    requestId?: string | null;
    offerId?: string | null;
    workOrderId?: string | null;
  };
}

export interface ReserveAndDebitResult {
  transactionId: string;
  creditsCharged: number;
  usageRecordId: string;
}

export interface RefundInput {
  idempotencyKey?: string;
  usageRecordId?: string;
  reason?: string;
}

@Injectable()
export class AiCreditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kullanıcı cüzdanını garanti eder; yoksa FREE abonelik + dönem GRANT oluşturur.
   * Dönem bittiyse aylık krediyi yeniler.
   */
  async ensureWalletForUser(userId: string) {
    const existing = await this.prisma.aiCreditWallet.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.periodEnd <= new Date()) {
        return this.renewPeriod(existing.id, userId);
      }
      return existing;
    }

    return this.createWalletWithFreePlan(userId);
  }

  async getWalletSummary(userId: string): Promise<AiCreditWalletSummary> {
    const wallet = await this.ensureWalletForUser(userId);
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const plan = subscription?.plan;
    return {
      balanceCredits: wallet.balanceCredits,
      periodStart: wallet.periodStart.toISOString(),
      periodEnd: wallet.periodEnd.toISOString(),
      lifetimeGranted: wallet.lifetimeGranted,
      lifetimeSpent: wallet.lifetimeSpent,
      planCode: (plan?.code ?? SubscriptionPlanCode.FREE) as SubscriptionPlanCode,
      monthlyCredits: plan?.monthlyCredits ?? MONETIZATION.freeTrialCreditsPerMonth,
    };
  }

  async listTransactions(userId: string, limit = 50): Promise<AiCreditTransaction[]> {
    const wallet = await this.ensureWalletForUser(userId);
    const rows = await this.prisma.aiCreditTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((row) => ({
      id: row.id,
      walletId: row.walletId,
      type: row.type as AiCreditTxType,
      amountCredits: row.amountCredits,
      balanceAfter: row.balanceAfter,
      featureCode: row.featureCode,
      idempotencyKey: row.idempotencyKey,
      usageRecordId: row.usageRecordId,
      note: row.note,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listUsage(userId: string, limit = 50): Promise<AiUsageRecordView[]> {
    await this.ensureWalletForUser(userId);
    const rows = await this.prisma.aiUsageRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      businessId: row.businessId,
      tenantId: row.tenantId,
      featureCode: row.featureCode,
      provider: row.provider,
      model: row.model,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      creditsCharged: row.creditsCharged,
      durationMs: row.durationMs,
      success: row.success,
      errorCode: row.errorCode,
      idempotencyKey: row.idempotencyKey,
      requestId: row.requestId,
      offerId: row.offerId,
      workOrderId: row.workOrderId,
      refundedAt: row.refundedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listPlans(): Promise<SubscriptionPlan[]> {
    const rows = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      code: row.code as SubscriptionPlanCode,
      name: row.name,
      monthlyCredits: row.monthlyCredits,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  /**
   * Idempotent debit. Özellik plan dışıysa AI_FEATURE_NOT_IN_PLAN,
   * bakiye yetersizse AI_CREDITS_EXHAUSTED.
   */
  async reserveAndDebit(input: ReserveAndDebitInput): Promise<ReserveAndDebitResult> {
    const existing = await this.prisma.aiCreditTransaction.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.type !== AiCreditTxType.DEBIT) {
        throw new AppException('CONFLICT', {
          message: 'Bu idempotency anahtarı debit dışı bir harekete bağlı.',
          context: { idempotencyKey: input.idempotencyKey, type: existing.type },
        });
      }
      return {
        transactionId: existing.id,
        creditsCharged: existing.amountCredits,
        usageRecordId: existing.usageRecordId ?? '',
      };
    }

    const wallet = await this.ensureWalletForUser(input.userId);
    await this.assertFeatureInPlan(input.userId, input.featureCode);

    const feature = await this.prisma.aiFeature.findUnique({
      where: { code: input.featureCode as PrismaAiFeatureCode },
    });
    const cost =
      input.estimatedCredits ??
      estimateCredits({
        feature: input.featureCode,
        ...(feature ? { baseCostCredits: feature.baseCostCredits } : {}),
      });

    if (wallet.balanceCredits < cost) {
      throw new AppException('AI_CREDITS_EXHAUSTED', {
        message: 'AI krediniz tükendi. Temel uygulama çalışmaya devam eder.',
        context: {
          balanceCredits: wallet.balanceCredits,
          requiredCredits: cost,
          featureCode: input.featureCode,
        },
      });
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const usage = await tx.aiUsageRecord.create({
          data: {
            userId: input.userId,
            businessId: input.businessId ?? null,
            tenantId: input.metadata?.tenantId ?? null,
            featureCode: input.featureCode as PrismaAiFeatureCode,
            provider: input.metadata?.provider ?? 'pending',
            model: input.metadata?.model ?? null,
            creditsCharged: cost,
            success: false,
            idempotencyKey: input.idempotencyKey,
            requestId: input.metadata?.requestId ?? null,
            offerId: input.metadata?.offerId ?? null,
            workOrderId: input.metadata?.workOrderId ?? null,
          },
        });

        const updated = await tx.aiCreditWallet.update({
          where: { id: wallet.id },
          data: {
            balanceCredits: { decrement: cost },
            lifetimeSpent: { increment: cost },
          },
        });

        const txRow = await tx.aiCreditTransaction.create({
          data: {
            walletId: wallet.id,
            type: AiCreditTxType.DEBIT,
            amountCredits: cost,
            balanceAfter: updated.balanceCredits,
            featureCode: input.featureCode as PrismaAiFeatureCode,
            idempotencyKey: input.idempotencyKey,
            usageRecordId: usage.id,
          },
        });

        return {
          transactionId: txRow.id,
          creditsCharged: cost,
          usageRecordId: usage.id,
        };
      });
    } catch (error) {
      // Yarış durumunda aynı idempotencyKey ile tekrar dene
      if (this.isUniqueViolation(error)) {
        const raced = await this.prisma.aiCreditTransaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (raced?.type === AiCreditTxType.DEBIT) {
          return {
            transactionId: raced.id,
            creditsCharged: raced.amountCredits,
            usageRecordId: raced.usageRecordId ?? '',
          };
        }
      }
      throw error;
    }
  }

  /** Başarılı tamamlamada usage kaydını günceller. */
  async markUsageSuccess(input: {
    usageRecordId: string;
    provider: string;
    model?: string | null;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
  }): Promise<void> {
    await this.prisma.aiUsageRecord.update({
      where: { id: input.usageRecordId },
      data: {
        success: true,
        provider: input.provider,
        model: input.model ?? null,
        promptTokens: input.promptTokens,
        completionTokens: input.completionTokens,
        durationMs: input.durationMs,
        errorCode: null,
      },
    });
  }

  /** Başarısız AI sonrası idempotent iade. */
  async refund(input: RefundInput): Promise<AiCreditTransaction | null> {
    if (!input.idempotencyKey && !input.usageRecordId) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'İade için idempotencyKey veya usageRecordId gerekli.',
      });
    }

    const debit = input.idempotencyKey
      ? await this.prisma.aiCreditTransaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        })
      : await this.prisma.aiCreditTransaction.findFirst({
          where: {
            usageRecordId: input.usageRecordId,
            type: AiCreditTxType.DEBIT,
          },
        });

    if (!debit || debit.type !== AiCreditTxType.DEBIT) {
      return null;
    }

    const refundKey = `refund:${debit.idempotencyKey}`;
    const existingRefund = await this.prisma.aiCreditTransaction.findUnique({
      where: { idempotencyKey: refundKey },
    });
    if (existingRefund) {
      return {
        id: existingRefund.id,
        walletId: existingRefund.walletId,
        type: existingRefund.type as AiCreditTxType,
        amountCredits: existingRefund.amountCredits,
        balanceAfter: existingRefund.balanceAfter,
        featureCode: existingRefund.featureCode,
        idempotencyKey: existingRefund.idempotencyKey,
        usageRecordId: existingRefund.usageRecordId,
        note: existingRefund.note,
        createdAt: existingRefund.createdAt.toISOString(),
      };
    }

    if (debit.usageRecordId) {
      const usage = await this.prisma.aiUsageRecord.findUnique({
        where: { id: debit.usageRecordId },
      });
      if (usage?.refundedAt) {
        return null;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.aiCreditWallet.update({
        where: { id: debit.walletId },
        data: {
          balanceCredits: { increment: debit.amountCredits },
          lifetimeSpent: { decrement: debit.amountCredits },
        },
      });

      const refundTx = await tx.aiCreditTransaction.create({
        data: {
          walletId: debit.walletId,
          type: AiCreditTxType.REFUND,
          amountCredits: debit.amountCredits,
          balanceAfter: updated.balanceCredits,
          featureCode: debit.featureCode,
          idempotencyKey: refundKey,
          usageRecordId: debit.usageRecordId,
          note: input.reason ?? 'AI failure refund',
        },
      });

      if (debit.usageRecordId) {
        await tx.aiUsageRecord.update({
          where: { id: debit.usageRecordId },
          data: {
            refundedAt: new Date(),
            success: false,
            errorCode: input.reason ?? 'REFUNDED',
          },
        });
      }

      return refundTx;
    });

    return {
      id: result.id,
      walletId: result.walletId,
      type: result.type as AiCreditTxType,
      amountCredits: result.amountCredits,
      balanceAfter: result.balanceAfter,
      featureCode: result.featureCode,
      idempotencyKey: result.idempotencyKey,
      usageRecordId: result.usageRecordId,
      note: result.note,
      createdAt: result.createdAt.toISOString(),
    };
  }

  private async assertFeatureInPlan(userId: string, featureCode: AiFeatureCode): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING'] },
      },
      include: {
        plan: {
          include: {
            features: {
              where: { featureCode: featureCode as PrismaAiFeatureCode, included: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const included = (subscription?.plan.features.length ?? 0) > 0;
    // Seed yoksa FREE deneme özelliklerine düş
    if (!subscription) {
      const freeAllowed: string[] = [AiFeatureCode.AGENT_CHAT, AiFeatureCode.GENERIC_COMPLETE];
      if (!freeAllowed.includes(featureCode)) {
        throw new AppException('AI_FEATURE_NOT_IN_PLAN', {
          message: 'Bu AI özelliği mevcut planınızda yok.',
          context: { featureCode, planCode: SubscriptionPlanCode.FREE },
        });
      }
      return;
    }

    if (!included) {
      throw new AppException('AI_FEATURE_NOT_IN_PLAN', {
        message: 'Bu AI özelliği mevcut planınızda yok.',
        context: { featureCode, planCode: subscription.plan.code },
      });
    }
  }

  private async createWalletWithFreePlan(userId: string) {
    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: 'FREE' },
    });
    if (!freePlan) {
      throw new AppException('SERVICE_UNAVAILABLE', {
        message: 'FREE abonelik planı tanımlı değil. Seed çalıştırın.',
      });
    }

    const { periodStart, periodEnd } = this.currentPeriodWindow();
    const credits = freePlan.monthlyCredits;

    return this.prisma.$transaction(async (tx) => {
      const existingSub = await tx.subscription.findFirst({
        where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      });
      if (!existingSub) {
        await tx.subscription.create({
          data: {
            userId,
            planId: freePlan.id,
            status: 'ACTIVE',
            provider: 'INTERNAL',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      const wallet = await tx.aiCreditWallet.create({
        data: {
          userId,
          balanceCredits: credits,
          periodStart,
          periodEnd,
          lifetimeGranted: credits,
          lifetimeSpent: 0,
        },
      });

      await tx.aiCreditTransaction.create({
        data: {
          walletId: wallet.id,
          type: AiCreditTxType.GRANT,
          amountCredits: credits,
          balanceAfter: credits,
          idempotencyKey: `grant:free:${userId}:${periodStart.toISOString()}`,
          note: 'FREE aylık kredi',
        },
      });

      return wallet;
    });
  }

  private async renewPeriod(walletId: string, userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    const monthly =
      subscription?.plan.monthlyCredits ?? MONETIZATION.freeTrialCreditsPerMonth;
    const { periodStart, periodEnd } = this.currentPeriodWindow();
    const grantKey = `grant:renew:${userId}:${periodStart.toISOString()}`;

    const existingGrant = await this.prisma.aiCreditTransaction.findUnique({
      where: { idempotencyKey: grantKey },
    });
    if (existingGrant) {
      return this.prisma.aiCreditWallet.findUniqueOrThrow({ where: { id: walletId } });
    }

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.aiCreditWallet.update({
        where: { id: walletId },
        data: {
          balanceCredits: monthly,
          periodStart,
          periodEnd,
          lifetimeGranted: { increment: monthly },
        },
      });

      if (subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      await tx.aiCreditTransaction.create({
        data: {
          walletId,
          type: AiCreditTxType.GRANT,
          amountCredits: monthly,
          balanceAfter: monthly,
          idempotencyKey: grantKey,
          note: 'Dönem yenileme',
        },
      });

      return wallet;
    });
  }

  private currentPeriodWindow(): { periodStart: Date; periodEnd: Date } {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    return { periodStart, periodEnd };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as Prisma.PrismaClientKnownRequestError).code === 'P2002'
    );
  }
}
