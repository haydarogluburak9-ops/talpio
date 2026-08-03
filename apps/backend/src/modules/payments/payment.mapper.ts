import type { Payment, ProviderWalletSummary, Transaction } from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';

export type PaymentRow = Prisma.PaymentGetPayload<Record<string, never>>;
export type TransactionRow = Prisma.TransactionGetPayload<Record<string, never>>;
export type WalletRow = Prisma.ProviderWalletGetPayload<Record<string, never>>;

export function toPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    orderId: row.orderId,
    status: row.status,
    amount: { amountMinor: row.amountMinor, currency: row.currency },
    providerName: row.providerName,
    providerReference: row.providerReference,
    authorizedAt: row.authorizedAt?.toISOString() ?? null,
    capturedAt: row.capturedAt?.toISOString() ?? null,
    refundedAt: row.refundedAt?.toISOString() ?? null,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    paymentId: row.paymentId,
    orderId: row.orderId,
    walletId: row.walletId,
    type: row.type,
    amount: { amountMinor: row.amountMinor, currency: row.currency },
    balanceAfterMinor: row.balanceAfterMinor,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Cüzdan kaydı ilk ödemeyle açıldığından, satırı olmayan usta sıfır bakiye görür. */
export function toWalletSummary(row: WalletRow | null, currency: string): ProviderWalletSummary {
  return {
    balance: { amountMinor: row?.balanceMinor ?? 0, currency: row?.currency ?? currency },
    pending: { amountMinor: row?.pendingMinor ?? 0, currency: row?.currency ?? currency },
  };
}
