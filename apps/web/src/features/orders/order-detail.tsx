'use client';

import { ORDER_STATUS_TONES } from '@ustapilot/config';
import { formatDate, formatMoney, orderStatusLabel } from '@ustapilot/localization';
import { OrderStatus, UserRole, type Order } from '@ustapilot/types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
  StatusPill,
} from '@ustapilot/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { useOpenConversation } from '@/features/messages/use-messages';
import { OrderPaymentSection } from '@/features/payments/order-payment-section';
import { OrderReviewSection } from '@/features/reviews/order-review-section';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import {
  useApproveOrder,
  useCancelOrder,
  useCompleteOrder,
  useOrder,
  usePayOrder,
  useStartOrder,
} from './use-orders';

/** İşin ilerleyişi dört adımda okunur; sipariş durumu bu adımlara eşlenir. */
const STEPS = ['Ödeme', 'İşe başlama', 'Teslim', 'Onay'] as const;

const COMPLETED_STEP_COUNT: Record<OrderStatus, number> = {
  [OrderStatus.PENDING_PAYMENT]: 0,
  [OrderStatus.PAID]: 1,
  [OrderStatus.IN_PROGRESS]: 2,
  [OrderStatus.AWAITING_APPROVAL]: 3,
  [OrderStatus.COMPLETED]: 4,
  [OrderStatus.CANCELLED]: 0,
  [OrderStatus.REFUNDED]: 0,
  [OrderStatus.DISPUTED]: 3,
};

export function OrderDetail({ orderId }: { orderId: string }) {
  const order = useOrder(orderId);

  if (order.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description="Sipariş yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
        action={{ label: t('common.retry'), onClick: () => void order.refetch() }}
      />
    );
  }

  if (!order.data) return <LoadingState label="Sipariş yükleniyor" />;

  return <OrderDetailView order={order.data} />;
}

function OrderDetailView({ order }: { order: Order }) {
  const locale = publicEnv.defaultLocale;
  const session = useSession();
  const isProvider = session.data?.role === UserRole.PROVIDER;

  const pay = usePayOrder(order.id);
  const start = useStartOrder(order.id);
  const complete = useCompleteOrder(order.id);
  const approve = useApproveOrder(order.id);
  const cancel = useCancelOrder(order.id);

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const canCancel =
    order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.PAID;

  const failed = [pay, start, complete, approve, cancel].some((action) => action.isError);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-xl">{order.job?.title ?? t('order.detailTitle')}</CardTitle>
            <StatusPill
              label={orderStatusLabel(order.status, locale)}
              tone={ORDER_STATUS_TONES[order.status]}
            />
          </div>
          <p className="text-sm text-foreground-muted">
            {order.job?.category.name}
            {order.job ? ` · ${order.job.address.districtName}, ${order.job.address.cityName}` : ''}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ProgressTrail status={order.status} />
          <p className="text-sm text-foreground-muted">{waitingHint(order.status, isProvider)}</p>
          {/* Talep detayı müşterinin kendi sayfasında yaşar; ustaya işin bilgileri
              zaten bu ekranda gösterildiği için ayrıca bağlantı verilmez. */}
          {order.job && !isProvider ? (
            <Link
              href={`/taleplerim/${order.job.id}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {t('order.forJob')}: {order.job.title}
            </Link>
          ) : null}

          {!isProvider && order.provider ? (
            <Link
              href={`/ustalar/${order.providerProfileId}`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              {t('provider.profileTitle')}: {order.provider.displayName}
            </Link>
          ) : null}

          <OpenChatButton orderId={order.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isProvider ? 'Hakediş' : 'Ödeme'}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <DetailRow label={t('order.total')} value={formatMoney(order.total, locale)} />
            {isProvider ? (
              <>
                <DetailRow
                  label={t('order.commission')}
                  value={formatMoney(order.commission, locale)}
                />
                <DetailRow
                  label={t('order.payout')}
                  value={formatMoney(order.providerPayout, locale)}
                />
              </>
            ) : null}
            <DetailRow
              label={isProvider ? 'Müşteri' : 'Usta'}
              value={(isProvider ? order.customer?.displayName : order.provider?.displayName) ?? '—'}
            />
            <DetailRow
              label={t('order.scheduledAt')}
              value={order.scheduledAt ? formatDate(order.scheduledAt, locale) : '—'}
            />
            <DetailRow
              label={t('order.startedAt')}
              value={order.startedAt ? formatDate(order.startedAt, locale) : '—'}
            />
            <DetailRow
              label={t('order.completedAt')}
              value={order.completedAt ? formatDate(order.completedAt, locale) : '—'}
            />
            <DetailRow
              label={t('order.approvedAt')}
              value={order.approvedAt ? formatDate(order.approvedAt, locale) : '—'}
            />
            {order.job?.address.addressLine ? (
              <DetailRow
                label="Adres"
                value={order.job.address.addressLine}
                className="sm:col-span-2"
              />
            ) : null}
            {order.cancellationReason ? (
              <DetailRow
                label={t('order.cancellationReason')}
                value={order.cancellationReason}
                className="sm:col-span-2"
              />
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 sm:pt-6">
          {failed ? (
            <p role="alert" className="text-sm text-danger-on-surface">
              {t('order.actionFailed')}
            </p>
          ) : null}

          {!isProvider && order.status === OrderStatus.PENDING_PAYMENT ? (
            <Action
              hint={t('order.payHint')}
              label={t('order.pay')}
              isLoading={pay.isPending}
              onClick={() => pay.mutate(undefined)}
            />
          ) : null}

          {isProvider && order.status === OrderStatus.PAID ? (
            <Action
              hint={t('order.startHint')}
              label={t('order.start')}
              isLoading={start.isPending}
              onClick={() => start.mutate(undefined)}
            />
          ) : null}

          {isProvider && order.status === OrderStatus.IN_PROGRESS ? (
            <Action
              hint={t('order.completeHint')}
              label={t('order.complete')}
              isLoading={complete.isPending}
              onClick={() => complete.mutate(undefined)}
            />
          ) : null}

          {!isProvider && order.status === OrderStatus.AWAITING_APPROVAL ? (
            <Action
              hint={t('order.approveHint')}
              label={t('order.approve')}
              isLoading={approve.isPending}
              onClick={() => approve.mutate(undefined)}
            />
          ) : null}

          {canCancel ? (
            confirmingCancel ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-foreground">{t('order.cancelConfirm')}</p>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={cancel.isPending}
                  onClick={() => cancel.mutate(undefined)}
                >
                  {t('order.cancelConfirmAction')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setConfirmingCancel(true)}>
                {t('order.cancel')}
              </Button>
            )
          ) : null}

          {order.status === OrderStatus.IN_PROGRESS ||
          order.status === OrderStatus.AWAITING_APPROVAL ? (
            <p className="text-sm text-foreground-muted">{t('order.cancelLocked')}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Makbuz müşterinin ödemesini gösterir; ustanın karşılığı cüzdan özetidir. */}
      {!isProvider ? <OrderPaymentSection order={order} /> : null}

      <OrderReviewSection order={order} isProvider={isProvider} />
    </div>
  );
}

/**
 * Sohbeti açar ve içine girer.
 *
 * Sohbet sipariş oluşurken kendiliğinden açılmaz; boş yazışma üretmemek için
 * ilk giriş anında sunucuda kurulur.
 */
function OpenChatButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const open = useOpenConversation();

  return (
    <Button
      variant="outline"
      size="sm"
      className="self-start"
      isLoading={open.isPending}
      onClick={() =>
        open.mutate(orderId, {
          onSuccess: (conversation) => router.push(`/mesajlar/${conversation.id}`),
        })
      }
    >
      {t('messaging.openChat')}
    </Button>
  );
}

function Action({
  hint,
  label,
  isLoading,
  onClick,
}: {
  hint: string;
  label: string;
  isLoading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-foreground-muted">{hint}</p>
      <Button className="self-start" isLoading={isLoading} onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}

function ProgressTrail({ status }: { status: OrderStatus }) {
  const done = COMPLETED_STEP_COUNT[status];
  const stopped = status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED;

  return (
    <ol className="flex flex-wrap gap-2" aria-label="İş ilerlemesi">
      {STEPS.map((step, index) => {
        const isDone = !stopped && index < done;
        const isCurrent = !stopped && index === done;

        return (
          <li
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            className={
              isDone
                ? 'rounded-full bg-success-surface px-3 py-1 text-xs font-medium text-success-on-surface'
                : isCurrent
                  ? 'rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-border px-3 py-1 text-xs text-foreground-muted'
            }
          >
            {step}
          </li>
        );
      })}
    </ol>
  );
}

/** Sıradaki adımı bekleyen tarafı açıkça yazar; boş ekran belirsizlik yaratır. */
function waitingHint(status: OrderStatus, isProvider: boolean): string {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return isProvider ? t('order.waitingCustomer') : t('order.payHint');
    case OrderStatus.PAID:
      return isProvider ? t('order.startHint') : t('order.waitingProvider');
    case OrderStatus.IN_PROGRESS:
      return isProvider ? t('order.completeHint') : t('order.waitingProvider');
    case OrderStatus.AWAITING_APPROVAL:
      return isProvider ? t('order.waitingApproval') : t('order.approveHint');
    case OrderStatus.COMPLETED:
      return t('order.finished');
    default:
      return '';
  }
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
