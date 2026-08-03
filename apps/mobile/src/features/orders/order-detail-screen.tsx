import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney } from '@ustapilot/localization';
import { OrderStatus, type Order } from '@ustapilot/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/state-views';
import { OrderStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useOpenConversation } from '@/features/messages/use-messages';
import { OrderReviewSection } from '@/features/reviews/order-review-section';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import {
  useApproveOrder,
  useCancelOrder,
  useCompleteOrder,
  useOrder,
  usePayOrder,
  useStartOrder,
} from './use-orders';

/** İşin ilerleyişi dört adımda okunur; sipariş durumu bu adımlara eşlenir. */
const STEP_KEYS = ['pay', 'start', 'complete', 'approve'] as const;

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

export function OrderDetailScreen({
  orderId,
  variant,
}: {
  orderId: string;
  variant: 'customer' | 'provider';
}) {
  const { t } = useI18n();
  const order = useOrder(orderId);

  if (order.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void order.refetch()}
        />
      </Screen>
    );
  }

  if (!order.data) {
    return (
      <Screen>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  return (
    <OrderDetailContent
      order={order.data}
      variant={variant}
      onRefresh={() => void order.refetch()}
      refreshing={order.isRefetching}
    />
  );
}

function OrderDetailContent({
  order,
  variant,
  onRefresh,
  refreshing,
}: {
  order: Order;
  variant: 'customer' | 'provider';
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const isProvider = variant === 'provider';

  const pay = usePayOrder(order.id);
  const start = useStartOrder(order.id);
  const complete = useCompleteOrder(order.id);
  const approve = useApproveOrder(order.id);
  const cancel = useCancelOrder(order.id);

  const [confirming, setConfirming] = useState(false);

  const canCancel =
    order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.PAID;
  const failed = [pay, start, complete, approve, cancel].some((action) => action.isError);

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card>
        <View style={styles.header}>
          <Text variant="title" style={styles.flex}>
            {order.job?.title ?? t('order.detailTitle')}
          </Text>
          <OrderStatusPill status={order.status} locale={locale} />
        </View>

        {order.job ? (
          <Text variant="caption" tone="muted">
            {order.job.category.name} · {order.job.address.districtName},{' '}
            {order.job.address.cityName}
          </Text>
        ) : null}

        <ProgressTrail status={order.status} />

        <Text variant="caption" tone="muted">
          {waitingHint(order.status, isProvider, t)}
        </Text>

        <OpenChatButton orderId={order.id} variant={variant} />

        {isProvider ? null : (
          <Button
            label={t('provider.profileTitle')}
            variant="outline"
            size="sm"
            onPress={() => router.push(`/customer/providers/${order.providerProfileId}`)}
          />
        )}
      </Card>

      <Card>
        <Text variant="bodyStrong">{isProvider ? t('order.payout') : t('order.total')}</Text>

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
          label={isProvider ? t('order.customer') : t('order.provider')}
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
          <DetailRow label={t('job.address')} value={order.job.address.addressLine} />
        ) : null}
        {order.cancellationReason ? (
          <DetailRow label={t('order.cancellationReason')} value={order.cancellationReason} />
        ) : null}
      </Card>

      <Card>
        {failed ? (
          <Text variant="caption" tone="danger">
            {t('order.actionFailed')}
          </Text>
        ) : null}

        {!isProvider && order.status === OrderStatus.PENDING_PAYMENT ? (
          <Button
            label={t('order.pay')}
            block
            loading={pay.isPending}
            onPress={() => pay.mutate(undefined)}
          />
        ) : null}

        {isProvider && order.status === OrderStatus.PAID ? (
          <Button
            label={t('order.start')}
            block
            loading={start.isPending}
            onPress={() => start.mutate(undefined)}
          />
        ) : null}

        {isProvider && order.status === OrderStatus.IN_PROGRESS ? (
          <Button
            label={t('order.complete')}
            block
            loading={complete.isPending}
            onPress={() => complete.mutate(undefined)}
          />
        ) : null}

        {!isProvider && order.status === OrderStatus.AWAITING_APPROVAL ? (
          <Button
            label={t('order.approve')}
            block
            loading={approve.isPending}
            onPress={() => approve.mutate(undefined)}
          />
        ) : null}

        {canCancel ? (
          confirming ? (
            <View style={styles.confirm}>
              <Text variant="caption">{t('order.cancelConfirm')}</Text>
              <Button
                label={t('order.cancelConfirmAction')}
                variant="danger"
                size="sm"
                loading={cancel.isPending}
                onPress={() => cancel.mutate(undefined)}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => setConfirming(false)}
              />
            </View>
          ) : (
            <Button
              label={t('order.cancel')}
              variant="outline"
              size="sm"
              onPress={() => setConfirming(true)}
            />
          )
        ) : null}

        {order.status === OrderStatus.IN_PROGRESS ||
        order.status === OrderStatus.AWAITING_APPROVAL ? (
          <Text variant="caption" tone="muted">
            {t('order.cancelLocked')}
          </Text>
        ) : null}
      </Card>

      <OrderReviewSection order={order} isProvider={isProvider} />
    </Screen>
  );
}

/**
 * Sohbeti açar ve içine girer.
 *
 * Sohbet sipariş oluşurken kendiliğinden açılmaz; boş yazışma üretmemek için
 * ilk giriş anında sunucuda kurulur.
 */
function OpenChatButton({
  orderId,
  variant,
}: {
  orderId: string;
  variant: 'customer' | 'provider';
}) {
  const { t } = useI18n();
  const router = useRouter();
  const open = useOpenConversation();

  return (
    <Button
      label={t('messaging.openChat')}
      variant="outline"
      size="sm"
      loading={open.isPending}
      onPress={() =>
        open.mutate(orderId, {
          onSuccess: (conversation) => router.push(`/${variant}/chat/${conversation.id}`),
        })
      }
    />
  );
}

function ProgressTrail({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  const colors = useColors();
  const done = COMPLETED_STEP_COUNT[status];
  const stopped = status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED;

  return (
    <View style={styles.trail}>
      {STEP_KEYS.map((key, index) => {
        const isDone = !stopped && index < done;
        const isCurrent = !stopped && index === done;

        return (
          <Text
            key={key}
            variant="caption"
            style={[
              styles.step,
              {
                backgroundColor: isDone
                  ? colors.successSurface
                  : isCurrent
                    ? colors.brand
                    : colors.surfaceMuted,
                color: isDone
                  ? colors.successOnSurface
                  : isCurrent
                    ? colors.onBrand
                    : colors.foregroundMuted,
              },
            ]}
          >
            {t(`orderStep.${key}`)}
          </Text>
        );
      })}
    </View>
  );
}

/** Sıradaki adımı bekleyen tarafı açıkça yazar; boş ekran belirsizlik yaratır. */
function waitingHint(
  status: OrderStatus,
  isProvider: boolean,
  t: (key: string) => string,
): string {
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="caption" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
  trail: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  step: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: 'hidden',
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowLabel: { flex: 1 },
  rowValue: { flex: 1.4, textAlign: 'right' },
  confirm: { gap: spacing.sm },
});
