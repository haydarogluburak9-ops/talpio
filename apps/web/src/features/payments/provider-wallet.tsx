'use client';

import { formatDateTime, formatMoney, transactionTypeLabel } from '@talpio/localization';
import type { Transaction } from '@talpio/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ListSkeleton,
} from '@talpio/ui';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useMyTransactions, useProviderWallet } from './use-payments';

/** Satıcının cüzdanı: kullanılabilir bakiye, bloke hakediş ve son hareketler. */
export function ProviderWallet() {
  const locale = publicEnv.defaultLocale;
  const wallet = useProviderWallet();
  const transactions = useMyTransactions({ limit: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payment.walletTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {wallet.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            {t('payment.loadFailed')}{' '}
            <button type="button" onClick={() => void wallet.refetch()} className="underline">
              {t('common.retry')}
            </button>
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <Amount
              label={t('payment.availableBalance')}
              value={wallet.data ? formatMoney(wallet.data.balance, locale) : null}
            />
            <Amount
              label={t('payment.pendingBalance')}
              value={wallet.data ? formatMoney(wallet.data.pending, locale) : null}
              hint={t('payment.pendingHint')}
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-foreground">{t('payment.transactionsTitle')}</h3>

          {transactions.isPending ? <ListSkeleton rows={3} /> : null}

          {transactions.isError ? (
            <p role="alert" className="text-sm text-danger-on-surface">
              {t('payment.loadFailed')}{' '}
              <button
                type="button"
                onClick={() => void transactions.refetch()}
                className="underline"
              >
                {t('common.retry')}
              </button>
            </p>
          ) : null}

          {transactions.data && transactions.data.items.length === 0 ? (
            <EmptyState
              title={t('payment.transactionsEmpty')}
              description={t('payment.transactionsEmptyDescription')}
            />
          ) : null}

          {transactions.data && transactions.data.items.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {transactions.data.items.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </ul>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Amount({ label, value, hint }: { label: string; value: string | null; hint?: string }) {
  return (
    <div className="rounded-[--radius-card] border border-border p-4">
      {/* Veri gelmediyse tutar uydurulmaz. */}
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value ?? '—'}</p>
      <p className="text-sm text-foreground-muted">{label}</p>
      {hint ? <p className="mt-1 text-xs text-foreground-muted">{hint}</p> : null}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const locale = publicEnv.defaultLocale;
  const outgoing = transaction.amount.amountMinor < 0;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {transactionTypeLabel(transaction.type, locale)}
        </p>
        <p className="text-xs text-foreground-muted">
          {formatDateTime(transaction.createdAt, locale)}
          {transaction.description ? ` · ${transaction.description}` : ''}
        </p>
      </div>
      <span
        className={`text-sm font-medium tabular-nums ${
          outgoing ? 'text-danger-on-surface' : 'text-success-on-surface'
        }`}
      >
        {formatMoney(transaction.amount, locale)}
      </span>
    </li>
  );
}
