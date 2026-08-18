'use client';

import { formatDateTime, formatMoney } from '@talpio/localization';
import { StatusPill } from '@talpio/ui';
import { PaymentStatus, type AdminPaymentSummary } from '@talpio/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminPayments } from './use-admin';

const STATUS_OPTIONS = Object.values(PaymentStatus).map((status) => ({
  value: status,
  label: PAYMENT_STATUS_LABELS[status],
}));

export function PaymentsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<PaymentStatus | 'all'>('all');
  // Arama kutusunu sıfırlamak için kullanılan sayaç; artınca kutu yenilenir.
  const [filterVersion, setFilterVersion] = useState(0);

  const payments = useAdminPayments({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminPaymentSummary>[] = [
    {
      key: 'payment',
      header: 'Ödeme',
      cell: (payment) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{payment.jobTitle}</p>
          <p className="truncate text-xs text-foreground-muted">
            {payment.customerName} → {payment.providerName}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (payment) => (
        <div className="space-y-1">
          <StatusPill
            label={PAYMENT_STATUS_LABELS[payment.status]}
            tone={PAYMENT_STATUS_TONES[payment.status]}
          />
          {payment.failureReason ? (
            <p className="max-w-56 text-xs text-foreground-muted">{payment.failureReason}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Tutar',
      cell: (payment) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatMoney(payment.amount)}
        </span>
      ),
    },
    {
      key: 'provider',
      header: 'Sağlayıcı',
      hideBelow: 'md',
      cell: (payment) => (
        <div className="min-w-0">
          <p className="text-sm">{payment.paymentProvider}</p>
          <p className="truncate font-mono text-xs text-foreground-muted">
            {payment.providerReference ?? '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Tarih',
      hideBelow: 'lg',
      align: 'right',
      cell: (payment) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(payment.refundedAt ?? payment.createdAt)}
        </span>
      ),
    },
  ];

  const hasFilter = q !== '' || status !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödemeler</CardTitle>
        <CardDescription>
          Sipariş ödemelerinin sağlayıcı durumu, tutarı ve işlem numarası.
        </CardDescription>

        <div className="pt-2">
          <FilterBar
            canReset={hasFilter}
            onReset={() =>
              applyFilter(() => {
                setQ('');
                setStatus('all');
                setFilterVersion((version) => version + 1);
              })
            }
          >
            <SearchField
              key={filterVersion}
              onChange={(value) => applyFilter(() => setQ(value))}
              placeholder="Talep başlığı veya işlem numarası"
            />
            <FilterSelect
              label="Durum"
              value={status}
              options={STATUS_OPTIONS}
              allLabel="Tüm durumlar"
              onChange={(value) => applyFilter(() => setStatus(value))}
            />
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          rows={payments.data?.items ?? []}
          rowKey={(payment) => payment.id}
          isPending={payments.isPending}
          isError={payments.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan ödeme yok.' : 'Kayıtlı ödeme bulunamadı.'}
          onRetry={() => void payments.refetch()}
          minWidth={900}
        />

        <TablePagination
          meta={payments.data?.meta}
          onPageChange={setPage}
          isFetching={payments.isFetching}
        />
      </CardContent>
    </Card>
  );
}
