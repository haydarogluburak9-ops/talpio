'use client';

import { OrderStatus } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton } from '@talpio/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { OrderCard } from './order-card';
import { useMyOrders } from './use-orders';

/** Uzun durum listesi yerine tarafların gerçekten ayırdığı üç küme. */
const FILTERS = [
  { id: 'all', label: 'Tümü', status: undefined },
  {
    id: 'active',
    label: 'Devam eden',
    status: [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.IN_PROGRESS,
      OrderStatus.AWAITING_APPROVAL,
    ],
  },
  {
    id: 'closed',
    label: 'Kapanmış',
    status: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  },
] as const;

export function OrderList() {
  const [filterId, setFilterId] = useState<(typeof FILTERS)[number]['id']>('all');
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0];
  const orders = useMyOrders(filter.status ? { status: [...filter.status] } : {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Sipariş durumu süzgeci">
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
            {item.label}
          </button>
        ))}
      </div>

      {orders.isPending ? <ListSkeleton rows={3} /> : null}

      {orders.isError ? (
        <ErrorState
          title={t('status.errorTitle')}
          description="Siparişleriniz yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
          action={{ label: t('common.retry'), onClick: () => void orders.refetch() }}
        />
      ) : null}

      {orders.isSuccess && orders.data.items.length === 0 ? (
        <EmptyState
          title={filterId === 'all' ? t('order.empty') : 'Bu süzgeçte sipariş yok'}
          description={
            filterId === 'all'
              ? t('order.emptyDescription')
              : 'Başka bir durum seçerek diğer siparişlerinizi görebilirsiniz.'
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
