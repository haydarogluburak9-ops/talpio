import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { ApiError } from '@ustapilot/api-client';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { OfferCard } from '@/features/offers/offer-card';
import { flattenOfferPages, useJobOffersInfinite } from '@/features/offers/use-offers';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/** Bir talebe gelen teklifler. Karar ekranı teklif detayıdır. */
export default function JobOffersScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();

  const jobId = params.id ?? '';
  const offers = useJobOffersInfinite(jobId);
  const items = flattenOfferPages(offers.data?.pages);

  if (offers.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={
            offers.error instanceof ApiError ? offers.error.message : t('status.errorMessage')
          }
          retryLabel={t('common.retry')}
          onRetry={() => void offers.refetch()}
        />
      </Screen>
    );
  }

  if (offers.isPending) {
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
          icon="pricetag-outline"
          title={t('job.noOffers')}
          description={t('onboarding.slideTwoBody')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(offer) => offer.id}
        contentContainerStyle={styles.list}
        refreshing={offers.isRefetching}
        onRefresh={() => void offers.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (offers.hasNextPage && !offers.isFetchingNextPage) void offers.fetchNextPage();
        }}
        renderItem={({ item }) => (
          <OfferCard
            offer={item}
            onPress={() => router.push(`/customer/offers/${item.id}?jobId=${jobId}`)}
          />
        )}
        ListFooterComponent={
          offers.isFetchingNextPage ? (
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
  list: { padding: spacing.lg, gap: spacing.md },
});
