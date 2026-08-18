import { StyleSheet, View } from 'react-native';

import { formatMoney, formatRelativeTime } from '@talpio/localization';
import type { Order } from '@talpio/types';

import { Card } from '@/components/card';
import { OrderStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export interface OrderCardProps {
  order: Order;
  onPress: () => void;
  /** Satıcı hakedişini, müşteri ise ödeyeceği tutarı görmek ister. */
  variant?: 'customer' | 'provider';
}

export function OrderCard({ order, onPress, variant = 'customer' }: OrderCardProps) {
  const { t, locale } = useI18n();
  const isProvider = variant === 'provider';
  const amount = isProvider ? order.providerPayout : order.total;
  const counterparty = isProvider ? order.customer?.displayName : order.provider?.displayName;

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text variant="bodyStrong" numberOfLines={2} style={styles.title}>
          {order.job?.title ?? t('order.detailTitle')}
        </Text>
        <OrderStatusPill status={order.status} locale={locale} />
      </View>

      {order.job ? (
        <Text variant="caption" tone="muted">
          {order.job.category.name} · {order.job.address.districtName}, {order.job.address.cityName}
        </Text>
      ) : null}

      <Text variant="title">{formatMoney(amount, locale)}</Text>

      <Text variant="caption" tone="muted">
        {counterparty ? `${counterparty} · ` : ''}
        {formatRelativeTime(order.createdAt, locale)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { flex: 1 },
});
