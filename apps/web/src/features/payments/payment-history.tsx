'use client';

import { PAGINATION } from '@ustapilot/config';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  ListSkeleton,
} from '@ustapilot/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { PaymentCard } from './payment-card';
import { useMyPayments } from './use-payments';

/** Müşterinin ödeme geçmişi; her satır ilgili siparişin makbuzuna götürür. */
export function PaymentHistory() {
  const [page, setPage] = useState(1);
  const payments = useMyPayments({ page, limit: PAGINATION.defaultLimit });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payment.historyTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.isPending ? <ListSkeleton rows={3} /> : null}

        {payments.isError || (!payments.isPending && !payments.data) ? (
          <ErrorState
            title={t('status.errorTitle')}
            description={t('payment.loadFailed')}
            action={{ label: t('common.retry'), onClick: () => void payments.refetch() }}
          />
        ) : null}

        {payments.data && payments.data.items.length === 0 ? (
          <EmptyState title={t('payment.empty')} description={t('payment.emptyDescription')} />
        ) : null}

        {payments.data && payments.data.items.length > 0 ? (
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-3">
              {payments.data.items.map((payment) => (
                <li key={payment.id}>
                  <PaymentCard payment={payment} />
                </li>
              ))}
            </ul>

            {payments.data.meta.totalPages > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!payments.data.meta.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                >
                  {t('common.back')}
                </Button>
                <span className="text-sm text-foreground-muted">
                  {payments.data.meta.page} / {payments.data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!payments.data.meta.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  {t('common.next')}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
