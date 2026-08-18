import { FlatList, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { ReviewCard } from './review-card';
import { flattenReviewPages, useMyReviewsInfinite } from './use-reviews';

/**
 * Oturumdaki tarafın değerlendirmeleri. Aynı uç iki yönü de döndürür: satıcı
 * aldıklarını, müşteri yazdıklarını görür — cevap kutusu yalnızca ustada açılır.
 */
export function ReceivedReviewsScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const isProvider = variant === 'provider';

  const reviews = useMyReviewsInfinite();
  const items = flattenReviewPages(reviews.data?.pages);

  if (reviews.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('review.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void reviews.refetch()}
        />
      </Screen>
    );
  }

  if (reviews.isPending) {
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
          icon="star-outline"
          title={t('review.empty')}
          description={t(isProvider ? 'review.emptyDescription' : 'review.customerEmptyDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(review) => review.id}
        contentContainerStyle={styles.list}
        refreshing={reviews.isRefetching}
        onRefresh={() => void reviews.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
        }}
        renderItem={({ item }) => <ReviewCard review={item} replyable={isProvider} />}
        ListFooterComponent={
          reviews.isFetchingNextPage ? (
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
