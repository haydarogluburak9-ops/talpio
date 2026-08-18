import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatMoney } from '@talpio/localization';
import { OfferStatus, OrderStatus } from '@talpio/types';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useMyOffersInfinite } from '@/features/offers/use-offers';
import { useMyOrdersInfinite } from '@/features/orders/use-orders';
import { useProviderWallet } from '@/features/payments/use-payments';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

/** Satıcının "devam eden iş" saydığı sipariş durumları. */
const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_APPROVAL,
];

/**
 * Satıcı paneli özeti. Ölçümler sipariş ve teklif uçlarından gelir; veri
 * dönmediğinde sayı uydurulmaz, tire gösterilir.
 */
export default function ProviderDashboardScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const user = useCurrentUser();

  const activeOrders = useMyOrdersInfinite({ status: ACTIVE_ORDER_STATUSES });
  const completedOrders = useMyOrdersInfinite({ status: [OrderStatus.COMPLETED] });
  const pendingOffers = useMyOffersInfinite({ status: [OfferStatus.SUBMITTED] });
  const wallet = useProviderWallet();

  const metrics = [
    { label: t('provider.activeJobsTitle'), value: totalOf(activeOrders.data?.pages) },
    { label: t('provider.completedJobs'), value: totalOf(completedOrders.data?.pages) },
    { label: t('offer.listTitle'), value: totalOf(pendingOffers.data?.pages) },
    {
      label: t('provider.pendingPayout'),
      value: wallet.data ? formatMoney(wallet.data.pending, locale) : '—',
    },
  ];

  const refreshing =
    user.isRefetching || activeOrders.isRefetching || completedOrders.isRefetching;

  return (
    <Screen
      onRefresh={() => {
        void user.refetch();
        void activeOrders.refetch();
        void completedOrders.refetch();
        void pendingOffers.refetch();
        void wallet.refetch();
      }}
      refreshing={refreshing}
    >
      <Card style={{ backgroundColor: colors.brand, borderColor: colors.brand }}>
        <Text variant="caption" style={{ color: colors.onBrand, opacity: 0.85 }}>
          {t('provider.dashboardTitle')}
        </Text>
        <Text variant="title" style={{ color: colors.onBrand }} numberOfLines={1}>
          {user.data?.fullName ?? t('common.loading')}
        </Text>
      </Card>

      <View style={styles.grid}>
        {metrics.map((metric) => (
          <Card key={metric.label} style={styles.metric}>
            <Text variant="displaySm">{metric.value}</Text>
            <Text variant="caption" tone="muted" numberOfLines={2}>
              {metric.label}
            </Text>
          </Card>
        ))}
      </View>

      <Card onPress={() => router.push('/provider/(tabs)/active')}>
        <Text variant="bodyStrong">{t('provider.activeJobsTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('order.providerListTitle')}
        </Text>
      </Card>

      <Card onPress={() => router.push('/provider/(tabs)/available')}>
        <Text variant="bodyStrong">{t('provider.availableJobsTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('provider.serviceAreasHint')}
        </Text>
      </Card>

      <Card onPress={() => router.push('/provider/offers')}>
        <Text variant="bodyStrong">{t('offer.listTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('offer.compareTitle')}
        </Text>
      </Card>

      <Card onPress={() => router.push('/provider/reviews')}>
        <Text variant="bodyStrong">{t('review.receivedTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('review.replyHint')}
        </Text>
      </Card>

      <Card onPress={() => router.push('/provider/wallet')}>
        <Text variant="bodyStrong">{t('payment.walletTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('payment.pendingHint')}
        </Text>
      </Card>
    </Screen>
  );
}

/** Sayfalı sorgunun toplam kayıt sayısı; veri yoksa sayı basılmaz. */
function totalOf(pages: { meta: { total: number } }[] | undefined): string {
  return pages?.[0] ? String(pages[0].meta.total) : '—';
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metric: { width: '47.5%' },
});
