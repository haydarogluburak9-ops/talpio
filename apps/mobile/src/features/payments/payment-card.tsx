import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatDateTime, formatMoney } from '@ustapilot/localization';
import { PaymentStatus, type Payment } from '@ustapilot/types';

import { Card } from '@/components/card';
import { PaymentStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/** Ödemenin makbuz kartı; dokunulduğunda ilgili sipariş detayına gider. */
export function PaymentCard({
  payment,
  variant,
}: {
  payment: Payment;
  variant: 'customer' | 'provider';
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const settledAt = payment.refundedAt ?? payment.capturedAt ?? payment.createdAt;

  return (
    <Card onPress={() => router.push(`/${variant}/orders/${payment.orderId}`)}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{formatMoney(payment.amount, locale)}</Text>
          <Text variant="caption" tone="muted">
            {formatDateTime(settledAt, locale)}
          </Text>
        </View>
        <PaymentStatusPill status={payment.status} locale={locale} />
      </View>

      {payment.providerReference ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {t('payment.reference')}: {payment.providerReference}
        </Text>
      ) : null}

      {payment.status === PaymentStatus.FAILED && payment.failureReason ? (
        <Text variant="caption" tone="danger">
          {payment.failureReason}
        </Text>
      ) : null}

      {payment.refundedAt ? (
        <Text variant="caption" tone="muted">
          {t('payment.refundNotice')}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
});
