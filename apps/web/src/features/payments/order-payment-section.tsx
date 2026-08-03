'use client';

import { PAYMENT_STATUS_TONES } from '@ustapilot/config';
import { formatDateTime, formatMoney, paymentStatusLabel } from '@ustapilot/localization';
import { OrderStatus, PaymentStatus, type Order } from '@ustapilot/types';
import { Card, CardContent, CardHeader, CardTitle, ListSkeleton, StatusPill } from '@ustapilot/ui';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { usePaymentForOrder } from './use-payments';

/**
 * Sipariş detayındaki ödeme bölümü.
 *
 * Ödeme kaydı ancak tahsilat denemesiyle oluşur; henüz ödenmemiş siparişte
 * sorgu boş döner ve bölüm yalnızca bilgilendirme yazar.
 */
export function OrderPaymentSection({ order }: { order: Order }) {
  const locale = publicEnv.defaultLocale;
  const attempted = order.status !== OrderStatus.PENDING_PAYMENT;
  const payment = usePaymentForOrder(order.id, attempted);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('payment.receiptTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!attempted ? (
          <p className="text-sm text-foreground-muted">{t('payment.pendingNotice')}</p>
        ) : null}

        {attempted && payment.isPending ? <ListSkeleton rows={1} /> : null}

        {attempted && payment.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            {t('payment.loadFailed')}{' '}
            <button type="button" onClick={() => void payment.refetch()} className="underline">
              {t('common.retry')}
            </button>
          </p>
        ) : null}

        {payment.data ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-lg font-semibold text-foreground">
                {formatMoney(payment.data.amount, locale)}
              </span>
              <StatusPill
                label={paymentStatusLabel(payment.data.status, locale)}
                tone={PAYMENT_STATUS_TONES[payment.data.status]}
              />
            </div>

            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label={t('payment.method')} value={payment.data.providerName} />
              <Row label={t('payment.reference')} value={payment.data.providerReference ?? '—'} />
              <Row
                label={t('payment.paidAt')}
                value={
                  payment.data.capturedAt ? formatDateTime(payment.data.capturedAt, locale) : '—'
                }
              />
              {payment.data.refundedAt ? (
                <Row
                  label={t('payment.refundedAt')}
                  value={formatDateTime(payment.data.refundedAt, locale)}
                />
              ) : null}
            </dl>

            {payment.data.refundedAt ? (
              <p className="text-sm text-foreground-muted">{t('payment.refundNotice')}</p>
            ) : null}

            {payment.data.status === PaymentStatus.FAILED ? (
              <p role="alert" className="text-sm text-danger-on-surface">
                {payment.data.failureReason ?? t('payment.failedNotice')}
              </p>
            ) : null}
          </>
        ) : null}

        {attempted && payment.isSuccess && payment.data === null ? (
          <p className="text-sm text-foreground-muted">{t('payment.pendingNotice')}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 break-all text-sm text-foreground">{value}</dd>
    </div>
  );
}
