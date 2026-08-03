'use client';

import { PAYMENT_STATUS_TONES } from '@ustapilot/config';
import { formatDateTime, formatMoney, paymentStatusLabel } from '@ustapilot/localization';
import { PaymentStatus, type Payment } from '@ustapilot/types';
import { StatusPill } from '@ustapilot/ui';
import Link from 'next/link';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

/** Ödemenin makbuz satırı: tutar, durum ve sağlayıcı referansı. */
export function PaymentCard({ payment }: { payment: Payment }) {
  const locale = publicEnv.defaultLocale;
  const settledAt = payment.refundedAt ?? payment.capturedAt ?? payment.createdAt;

  return (
    <article className="flex flex-col gap-3 rounded-[--radius-card] border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{formatMoney(payment.amount, locale)}</p>
          <p className="text-sm text-foreground-muted">{formatDateTime(settledAt, locale)}</p>
        </div>
        <StatusPill
          label={paymentStatusLabel(payment.status, locale)}
          tone={PAYMENT_STATUS_TONES[payment.status]}
        />
      </div>

      {payment.providerReference ? (
        <p className="text-xs text-foreground-muted">
          {t('payment.reference')}:{' '}
          <span className="font-mono">{payment.providerReference}</span>
        </p>
      ) : null}

      {payment.status === PaymentStatus.FAILED && payment.failureReason ? (
        <p className="text-sm text-danger-on-surface">
          {t('payment.failureReason')}: {payment.failureReason}
        </p>
      ) : null}

      <Link
        href={`/siparislerim/${payment.orderId}`}
        className="self-start text-sm font-medium text-brand-600 hover:underline"
      >
        {t('order.detailTitle')}
      </Link>
    </article>
  );
}
