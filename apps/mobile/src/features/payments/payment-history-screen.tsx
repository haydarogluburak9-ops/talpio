import { FlatList, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { env } from '@/lib/env';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { PaymentCard } from './payment-card';
import { flattenPaymentPages, useMyPaymentsInfinite } from './use-payments';

/** Müşterinin ödeme geçmişi; her kart siparişin makbuzuna açılır. */
export function PaymentHistoryScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const payments = useMyPaymentsInfinite();

  if (!env.featurePayments) {
    return (
      <Screen>
        <Text variant="title">{t('payments.pageTitle')}</Text>
        <Text variant="body" tone="muted">
          {t('payments.featureOff')}
        </Text>
      </Screen>
    );
  }
  const items = flattenPaymentPages(payments.data?.pages);

  if (payments.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('payment.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void payments.refetch()}
        />
      </Screen>
    );
  }

  if (payments.isPending) {
    return (
      <Screen>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="card-outline"
          title={t('payment.empty')}
          description={t('payment.emptyDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(payment) => payment.id}
        contentContainerStyle={styles.list}
        refreshing={payments.isRefetching}
        onRefresh={() => void payments.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (payments.hasNextPage && !payments.isFetchingNextPage) void payments.fetchNextPage();
        }}
        renderItem={({ item }) => <PaymentCard payment={item} variant={variant} />}
        ListFooterComponent={
          payments.isFetchingNextPage ? (
            <Card>
              <Text variant="caption" tone="muted">
                {t('common.loading')}
              </Text>
            </Card>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
});
