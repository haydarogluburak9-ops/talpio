import { FlatList, StyleSheet, View } from 'react-native';

import type { ProviderSummary } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { ReviewCard } from './review-card';
import { Stars } from './star-rating';
import { flattenReviewPages, useProvider, useProviderReviewsInfinite } from './use-reviews';

/**
 * Satıcının herkese açık profili.
 *
 * Kart ve yorumlar giriş yapmamış ziyaretçiye de açıktır; bu yüzden ekran
 * oturum durumuna hiç bakmaz.
 */
export function ProviderReviewsScreen({ providerId }: { providerId: string }) {
  const { t } = useI18n();

  const provider = useProvider(providerId);
  const reviews = useProviderReviewsInfinite(providerId);
  const items = flattenReviewPages(reviews.data?.pages);

  if (provider.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void provider.refetch()}
        />
      </Screen>
    );
  }

  const header = (
    <View style={styles.header}>
      {provider.data ? <ProviderCard provider={provider.data} /> : <ListSkeleton rows={1} />}

      <Text variant="title">{t('review.listTitle')}</Text>

      {reviews.isError ? (
        <Card>
          <Text variant="caption" tone="danger">
            {t('review.loadFailed')}
          </Text>
        </Card>
      ) : null}

      {reviews.isPending ? <ListSkeleton rows={3} /> : null}

      {!reviews.isPending && !reviews.isError && items.length === 0 ? (
        <EmptyState
          icon="star-outline"
          title={t('review.empty')}
          description={t('review.emptyDescription')}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(review) => review.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        refreshing={reviews.isRefetching}
        onRefresh={() => {
          void provider.refetch();
          void reviews.refetch();
        }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (reviews.hasNextPage && !reviews.isFetchingNextPage) void reviews.fetchNextPage();
        }}
        renderItem={({ item }) => <ReviewCard review={item} />}
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

function ProviderCard({ provider }: { provider: ProviderSummary }) {
  const { t, categoryName } = useI18n();

  return (
    <Card>
      <View style={styles.titleRow}>
        <Text variant="title" style={styles.flex}>
          {provider.displayName}
        </Text>
        {provider.isVerified ? <Badge tone="success" label={t('provider.verified')} /> : null}
      </View>

      {provider.averageRating == null ? (
        <Text variant="caption" tone="muted">
          {t('review.noRating')}
        </Text>
      ) : (
        <View style={styles.ratingRow}>
          <Stars value={provider.averageRating} />
          <Text variant="bodyStrong">{provider.averageRating.toFixed(1)}</Text>
          <Text variant="caption" tone="muted">
            {t('review.ratingCount', { count: provider.reviewCount })}
          </Text>
        </View>
      )}

      <Text variant="caption" tone="muted">
        {`${t('provider.completedJobs')}: ${provider.completedJobCount}`}
      </Text>

      {provider.categories.length > 0 ? (
        <View style={styles.categories}>
          {provider.categories.map((category) => (
            <Badge key={category.id} tone="neutral" label={categoryName(category)} />
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  header: { gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  flex: { flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
