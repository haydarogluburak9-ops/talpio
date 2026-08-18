'use client';

import { ORDER_STATUS_TONES } from '@talpio/config';
import { formatMoney, formatRelativeTime, orderStatusLabel } from '@talpio/localization';
import type { Order } from '@talpio/types';
import { Card, CardContent, StatusPill } from '@talpio/ui';
import Link from 'next/link';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

export function OrderCard({ order }: { order: Order }) {
  const locale = publicEnv.defaultLocale;
  const address = order.job?.address;

  return (
    <Link href={`/siparislerim/${order.id}`} className="block rounded-[--radius-card]">
      <Card className="transition-colors hover:bg-surface-muted">
        <CardContent className="flex flex-col gap-3 pt-5 sm:pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{order.job?.title ?? t('order.detailTitle')}</p>
              <p className="text-sm text-foreground-muted">
                {order.job?.category.name}
                {address ? ` · ${address.districtName}, ${address.cityName}` : ''}
              </p>
            </div>
            <StatusPill
              label={orderStatusLabel(order.status, locale)}
              tone={ORDER_STATUS_TONES[order.status]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground-muted">
            <span className="font-medium text-foreground">{formatMoney(order.total, locale)}</span>
            {order.provider ? <span>{order.provider.displayName}</span> : null}
            <span className="ml-auto text-xs">{formatRelativeTime(order.createdAt, locale)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
