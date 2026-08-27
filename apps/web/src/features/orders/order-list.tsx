'use client';

import { OrderStatus } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton } from '@talpio/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { OrderCard } from './order-card';
import { useMyOrders } from './use-orders';

/** Uzun durum listesi yerine tarafların gerçekten ayırdığı üç küme. */
const FILTERS = [
  { id: 'all', labelKey: 'orderFilter.all', status: undefined },
  {
    id: 'active',
    labelKey: 'orderFilter.active',
    status: [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.IN_PROGRESS,
      OrderStatus.AWAITING_APPROVAL,
    ],
  },
  {
    id: 'closed',
    labelKey: 'orderFilter.closed',
    status: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  },
] as const;

export function OrderList() {
  const [filterId, setFilterId] = useState<(typeof FILTERS)[number]['id']>('all');
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0];
  const orders = useMyOrders(filter.status ? { status: [...filter.status] } : {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('order.statusFilterLabel')}>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilterId(item.id)}
            aria-pressed={item.id === filterId}
            className={
              item.id === filterId
                ? 'rounded-full bg-brand-600 px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-border px-4 py-1.5 text-sm text-foreground-muted hover:bg-surface-muted'
            }
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {orders.isPending ? <ListSkeleton rows={3} /> : null}

      {orders.isError ? (
        <ErrorState
          title={t('status.errorTitle')}
          description={t('order.listLoadFailed')}
          action={{ label: t('common.retry'), onClick: () => void orders.refetch() }}
        />
      ) : null}

      {orders.isSuccess && orders.data.items.length === 0 ? (
        <EmptyState
          title={filterId === 'all' ? t('order.empty') : t('order.emptyFiltered')}
          description={
            filterId === 'all'
              ? t('order.emptyDescription')
              : t('order.emptyFilteredDescription')
          }
        />
      ) : null}

      {orders.isSuccess && orders.data.items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orders.data.items.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
