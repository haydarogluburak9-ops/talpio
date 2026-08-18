'use client';

import { formatDateTime, formatMoney } from '@talpio/localization';
import { StatusPill } from '@talpio/ui';
import { OfferStatus, type AdminOfferSummary } from '@talpio/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { OFFER_STATUS_LABELS, OFFER_STATUS_TONES } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminOffers } from './use-admin';

const STATUS_OPTIONS = Object.values(OfferStatus).map((status) => ({
  value: status,
  label: OFFER_STATUS_LABELS[status],
}));

export function OffersPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<OfferStatus | 'all'>('all');
  // Arama kutusunu sıfırlamak için kullanılan sayaç; artınca kutu yenilenir.
  const [filterVersion, setFilterVersion] = useState(0);

  const offers = useAdminOffers({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(status === 'all' ? {} : { status: [status] }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminOfferSummary>[] = [
    {
      key: 'offer',
      header: 'Teklif',
      cell: (offer) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{offer.jobTitle}</p>
          <p className="truncate text-xs text-foreground-muted">{offer.providerName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      cell: (offer) => (
        <StatusPill
          label={OFFER_STATUS_LABELS[offer.status]}
          tone={OFFER_STATUS_TONES[offer.status]}
        />
      ),
    },
    {
      key: 'price',
      header: 'Tutar',
      cell: (offer) => (
        <span className="whitespace-nowrap font-medium tabular-nums">
          {formatMoney(offer.price)}
        </span>
      ),
    },
    {
      key: 'validUntil',
      header: 'Geçerlilik',
      hideBelow: 'md',
      cell: (offer) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(offer.validUntil)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Gönderim',
      hideBelow: 'lg',
      align: 'right',
      cell: (offer) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {formatDateTime(offer.createdAt)}
        </span>
      ),
    },
  ];

  const hasFilter = q !== '' || status !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teklifler</CardTitle>
        <CardDescription>
          Satıcıların taleplere verdiği teklifler; tutar ve geçerlilik süresiyle.
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
          rows={offers.data?.items ?? []}
          rowKey={(offer) => offer.id}
          isPending={offers.isPending}
          isError={offers.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan teklif yok.' : 'Kayıtlı teklif bulunamadı.'}
          onRetry={() => void offers.refetch()}
          minWidth={860}
        />

        <TablePagination
          meta={offers.data?.meta}
          onPageChange={setPage}
          isFetching={offers.isFetching}
        />
      </CardContent>
    </Card>
  );
}
