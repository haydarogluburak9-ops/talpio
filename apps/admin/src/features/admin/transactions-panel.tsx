'use client';

import { formatDateTime, formatMoney } from '@ustapilot/localization';
import { TransactionType, type AdminTransactionSummary } from '@ustapilot/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { TRANSACTION_TYPE_LABELS } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminTransactions } from './use-admin';

const TYPE_OPTIONS = Object.values(TransactionType).map((type) => ({
  value: type,
  label: TRANSACTION_TYPE_LABELS[type],
}));

export function TransactionsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [filterVersion, setFilterVersion] = useState(0);

  const transactions = useAdminTransactions({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(type === 'all' ? {} : { type: [type] }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminTransactionSummary>[] = [
    {
      key: 'type',
      header: 'Hareket',
      cell: (transaction) => (
        <div className="min-w-0">
          <p className="font-medium">{TRANSACTION_TYPE_LABELS[transaction.type]}</p>
          <p className="truncate text-xs text-foreground-muted">
            {transaction.description ?? '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Tutar',
      cell: (transaction) => (
        <span
          className={`whitespace-nowrap font-medium tabular-nums ${
            transaction.amount.amountMinor < 0 ? 'text-danger-500' : 'text-success-500'
          }`}
        >
          {formatMoney(transaction.amount)}
        </span>
      ),
    },
    {
      key: 'wallet',
      header: 'Cüzdan',
      hideBelow: 'md',
      cell: (transaction) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{transaction.walletOwnerName ?? 'Platform'}</p>
          <p className="whitespace-nowrap text-xs tabular-nums text-foreground-muted">
            {transaction.balanceAfterMinor === null || transaction.balanceAfterMinor === undefined
              ? '—'
              : formatMoney({
                  amountMinor: transaction.balanceAfterMinor,
                  currency: transaction.amount.currency,
                })}
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      hideBelow: 'lg',
      align: 'right',
      cell: (transaction) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(transaction.createdAt)}
        </span>
      ),
    },
  ];

  const hasFilter = q !== '' || type !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hareketler</CardTitle>
        <CardDescription>
          Değişmez muhasebe defteri: girişler pozitif, çıkışlar negatif yazılır.
        </CardDescription>

        <div className="pt-2">
          <FilterBar
            canReset={hasFilter}
            onReset={() =>
              applyFilter(() => {
                setQ('');
                setType('all');
                setFilterVersion((version) => version + 1);
              })
            }
          >
            <SearchField
              key={filterVersion}
              onChange={(value) => applyFilter(() => setQ(value))}
              placeholder="Hareket açıklaması"
            />
            <FilterSelect
              label="Tür"
              value={type}
              options={TYPE_OPTIONS}
              allLabel="Tüm türler"
              onChange={(value) => applyFilter(() => setType(value))}
            />
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          rows={transactions.data?.items ?? []}
          rowKey={(transaction) => transaction.id}
          isPending={transactions.isPending}
          isError={transactions.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan hareket yok.' : 'Kayıtlı hareket bulunamadı.'}
          onRetry={() => void transactions.refetch()}
          minWidth={860}
        />

        <TablePagination
          meta={transactions.data?.meta}
          onPageChange={setPage}
          isFetching={transactions.isFetching}
        />
      </CardContent>
    </Card>
  );
}
