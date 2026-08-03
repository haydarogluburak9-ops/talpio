'use client';

import { formatDateTime, formatMoney } from '@ustapilot/localization';
import { StatusPill } from '@ustapilot/ui';
import { OrderStatus, type AdminOrderSummary } from '@ustapilot/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminOrders } from './use-admin';

const STATUS_OPTIONS = Object.values(OrderStatus).map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status],
}));

export function OrdersPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  // Arama kutusunu sıfırlamak için kullanılan sayaç; artınca kutu yenilenir.
  const [filterVersion, setFilterVersion] = useState(0);

  const orders = useAdminOrders({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminOrderSummary>[] = [
    {
      key: 'order',
      header: 'Sipariş',
      cell: (order) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{order.jobTitle}</p>
          <p className="truncate text-xs text-foreground-muted">
            {order.customerName} → {order.providerName}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (order) => (
        <StatusPill
          label={ORDER_STATUS_LABELS[order.status]}
          tone={ORDER_STATUS_TONES[order.status]}
        />
      ),
    },
    {
      key: 'total',
      header: 'Tutar',
      cell: (order) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatMoney(order.total)}
        </span>
      ),
    },
    {
      key: 'commission',
      header: 'Komisyon',
      hideBelow: 'md',
      cell: (order) => (
        <span className="whitespace-nowrap tabular-nums text-foreground-muted">
          {formatMoney(order.commission)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Oluşturma',
      hideBelow: 'lg',
      align: 'right',
      cell: (order) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(order.createdAt)}
        </span>
      ),
    },
  ];

  const hasFilter = q !== '' || status !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Siparişler</CardTitle>
        <CardDescription>
          Kabul edilen tekliflerden doğan siparişler; tutar ve platform komisyonuyla.
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
              placeholder="Talep başlığı"
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
          rows={orders.data?.items ?? []}
          rowKey={(order) => order.id}
          isPending={orders.isPending}
          isError={orders.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan sipariş yok.' : 'Kayıtlı sipariş bulunamadı.'}
          onRetry={() => void orders.refetch()}
          minWidth={860}
        />

        <TablePagination
          meta={orders.data?.meta}
          onPageChange={setPage}
          isFetching={orders.isFetching}
        />
      </CardContent>
    </Card>
  );
}
