'use client';

import { formatDate, formatMoney } from '@ustapilot/localization';
import { StatusPill } from '@ustapilot/ui';
import type { AdminCommissionRuleSummary } from '@ustapilot/types';
import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, TablePagination, type TableColumn } from '@/components/ui/data-table';
import { COMMISSION_TYPE_LABELS } from '@/lib/labels';

import { FilterBar, FilterSelect, SearchField } from './filter-bar';
import { useAdminCommissionRules } from './use-admin';

type ActiveFilter = 'active' | 'passive';

const ACTIVE_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: 'active', label: 'Yürürlükte' },
  { value: 'passive', label: 'Pasif' },
];

/** 1250 baz puan = %12,5. Oran kuruş gibi tam sayı taşınır, bölme yalnızca gösterimde. */
function formatRate(rateBps: number): string {
  return `%${(rateBps / 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
}

export function CommissionsPanel() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [active, setActive] = useState<ActiveFilter | 'all'>('all');
  const [filterVersion, setFilterVersion] = useState(0);

  const rules = useAdminCommissionRules({
    page,
    limit: 20,
    ...(q ? { q } : {}),
    ...(active === 'all' ? {} : { isActive: active === 'active' }),
  });

  function applyFilter(change: () => void) {
    change();
    setPage(1);
  }

  const columns: TableColumn<AdminCommissionRuleSummary>[] = [
    {
      key: 'rule',
      header: 'Kural',
      cell: (rule) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{rule.name}</p>
          <p className="truncate text-xs text-foreground-muted">
            {[rule.categoryName, rule.cityName].filter(Boolean).join(' · ') || 'Tüm kapsam'}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tür',
      cell: (rule) => (
        <StatusPill
          label={COMMISSION_TYPE_LABELS[rule.type]}
          tone={rule.isActive ? 'info' : 'neutral'}
        />
      ),
    },
    {
      key: 'rate',
      header: 'Oran',
      cell: (rule) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="font-medium">{formatRate(rule.rateBps)}</p>
          {rule.fixedMinor > 0 ? (
            <p className="text-xs text-foreground-muted">
              + {formatMoney({ amountMinor: rule.fixedMinor, currency: 'TRY' })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'premium',
      header: 'Premium oran',
      hideBelow: 'md',
      cell: (rule) => (
        <span className="whitespace-nowrap tabular-nums text-foreground-muted">
          {rule.premiumRateBps === null || rule.premiumRateBps === undefined
            ? '—'
            : formatRate(rule.premiumRateBps)}
        </span>
      ),
    },
    {
      key: 'validity',
      header: 'Geçerlilik',
      hideBelow: 'lg',
      align: 'right',
      cell: (rule) => (
        <span className="whitespace-nowrap text-foreground-muted">
          {rule.validFrom ? formatDate(rule.validFrom) : 'Süresiz'}
          {rule.validUntil ? ` – ${formatDate(rule.validUntil)}` : ''}
        </span>
      ),
    },
  ];

  const hasFilter = q !== '' || active !== 'all';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Komisyon kuralları</CardTitle>
        <CardDescription>
          Öncelik sırasına göre yürürlükteki kurallar. Oran değişikliği yalnızca veritabanı
          üzerinden yapılır; panelden düzenleme açılmadı.
        </CardDescription>

        <div className="pt-2">
          <FilterBar
            canReset={hasFilter}
            onReset={() =>
              applyFilter(() => {
                setQ('');
                setActive('all');
                setFilterVersion((version) => version + 1);
              })
            }
          >
            <SearchField
              key={filterVersion}
              onChange={(value) => applyFilter(() => setQ(value))}
              placeholder="Kural adı"
            />
            <FilterSelect
              label="Durum"
              value={active}
              options={ACTIVE_OPTIONS}
              allLabel="Tümü"
              onChange={(value) => applyFilter(() => setActive(value))}
            />
          </FilterBar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <DataTable
          columns={columns}
          rows={rules.data?.items ?? []}
          rowKey={(rule) => rule.id}
          isPending={rules.isPending}
          isError={rules.isError}
          emptyLabel={hasFilter ? 'Bu filtreye uyan kural yok.' : 'Tanımlı komisyon kuralı yok.'}
          onRetry={() => void rules.refetch()}
          minWidth={880}
        />

        <TablePagination
          meta={rules.data?.meta}
          onPageChange={setPage}
          isFetching={rules.isFetching}
        />
      </CardContent>
    </Card>
  );
}
