import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { OrderStatus } from '@ustapilot/types';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { OrderCard } from './order-card';
import { flattenOrderPages, useMyOrdersInfinite } from './use-orders';

/** Tarafların gerçekten ayırdığı üç küme; ham durum listesi çok uzun. */
const FILTERS = [
  { id: 'all', status: undefined },
  {
    id: 'active',
    status: [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAID,
      OrderStatus.IN_PROGRESS,
      OrderStatus.AWAITING_APPROVAL,
    ],
  },
  {
    id: 'closed',
    status: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
  },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export function OrderListScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();

  const [filterId, setFilterId] = useState<FilterId>('all');
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0];

  const orders = useMyOrdersInfinite(filter.status ? { status: [...filter.status] } : {});
  const items = flattenOrderPages(orders.data?.pages);

  const filterRow = (
    <View style={styles.filters}>
      {FILTERS.map((item) => {
        const selected = item.id === filterId;
        return (
          <Text
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setFilterId(item.id)}
            variant="caption"
            style={[
              styles.filterChip,
              {
                backgroundColor: selected ? colors.brand : colors.surfaceMuted,
                color: selected ? colors.onBrand : colors.foregroundMuted,
              },
            ]}
          >
            {t(`orderFilter.${item.id}`)}
          </Text>
        );
      })}
    </View>
  );

  if (orders.isError) {
    return (
      <Screen>
        {filterRow}
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void orders.refetch()}
        />
      </Screen>
    );
  }

  if (orders.isPending) {
    return (
      <Screen>
        {filterRow}
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  if (items.length === 0) {
    const isProvider = variant === 'provider';
    return (
      <Screen>
        {filterRow}
        <EmptyState
          icon="receipt-outline"
          title={t(isProvider ? 'order.providerEmpty' : 'order.empty')}
          description={t(
            isProvider ? 'order.providerEmptyDescription' : 'order.emptyDescription',
          )}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={filterRow}
        refreshing={orders.isRefetching}
        onRefresh={() => void orders.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (orders.hasNextPage && !orders.isFetchingNextPage) void orders.fetchNextPage();
        }}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            variant={variant}
            onPress={() => router.push(`/${variant}/orders/${item.id}`)}
          />
        )}
        ListFooterComponent={
          orders.isFetchingNextPage ? (
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
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
    fontWeight: '600',
  },
});
