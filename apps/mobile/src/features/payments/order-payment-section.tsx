import { StyleSheet, View } from 'react-native';

import { formatDateTime, formatMoney } from '@ustapilot/localization';
import { OrderStatus, PaymentStatus, type Order } from '@ustapilot/types';

import { Card } from '@/components/card';
import { ListSkeleton } from '@/components/state-views';
import { PaymentStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { usePaymentForOrder } from './use-payments';

/**
 * Sipariş detayındaki makbuz bölümü.
 *
 * Ödeme kaydı ancak tahsilat denemesiyle oluşur; ödenmemiş siparişte yalnızca
 * bilgilendirme yazılır.
 */
export function OrderPaymentSection({ order }: { order: Order }) {
  const { t, locale } = useI18n();

  const attempted = order.status !== OrderStatus.PENDING_PAYMENT;
  const payment = usePaymentForOrder(order.id, attempted);

  return (
    <Card>
      <Text variant="bodyStrong">{t('payment.receiptTitle')}</Text>

      {!attempted ? (
        <Text variant="caption" tone="muted">
          {t('payment.pendingNotice')}
        </Text>
      ) : null}

      {attempted && payment.isPending ? <ListSkeleton rows={1} /> : null}

      {attempted && payment.isError ? (
        <Text variant="caption" tone="danger">
          {t('payment.loadFailed')}
        </Text>
      ) : null}

      {payment.data ? (
        <>
          <View style={styles.header}>
            <Text variant="title" style={styles.flex}>
              {formatMoney(payment.data.amount, locale)}
            </Text>
            <PaymentStatusPill status={payment.data.status} locale={locale} />
          </View>

          <Row label={t('payment.method')} value={payment.data.providerName} />
          <Row label={t('payment.reference')} value={payment.data.providerReference ?? '—'} />
          <Row
            label={t('payment.paidAt')}
            value={payment.data.capturedAt ? formatDateTime(payment.data.capturedAt, locale) : '—'}
          />
          {payment.data.refundedAt ? (
            <Row
              label={t('payment.refundedAt')}
              value={formatDateTime(payment.data.refundedAt, locale)}
            />
          ) : null}

          {payment.data.refundedAt ? (
            <Text variant="caption" tone="muted">
              {t('payment.refundNotice')}
            </Text>
          ) : null}

          {payment.data.status === PaymentStatus.FAILED ? (
            <Text variant="caption" tone="danger">
              {payment.data.failureReason ?? t('payment.failedNotice')}
            </Text>
          ) : null}
        </>
      ) : null}

      {attempted && payment.isSuccess && payment.data === null ? (
        <Text variant="caption" tone="muted">
          {t('payment.pendingNotice')}
        </Text>
      ) : null}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowLabel: { flex: 1 },
  rowValue: { flex: 1.4, textAlign: 'right' },
});
