import { compareOffers } from '@talpio/business-logic';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { OfferCard } from '@/features/offers/offer-card';
import { flattenOfferPages, useJobOffersInfinite } from '@/features/offers/use-offers';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

const BADGE_KEYS: Record<string, string> = {
  LOWEST_PRICE: 'offer.badgeLowestPrice',
  FASTEST_DELIVERY: 'offer.badgeFastestDelivery',
  HIGHEST_RATED: 'offer.badgeHighestRated',
  VERIFIED_BUSINESS: 'offer.badgeVerified',
  CLOSEST_SELLER: 'offer.badgeClosest',
  BEST_WARRANTY: 'offer.badgeBestWarranty',
  RESPONSE_QUALITY: 'offer.badgeResponseQuality',
};

/** Bir talebe gelen teklifler. Karar ekranı teklif detayıdır. */
export default function JobOffersScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();

  const jobId = params.id ?? '';
  const offers = useJobOffersInfinite(jobId);
  const items = flattenOfferPages(offers.data?.pages);
  const badgesById = useMemo(
    () =>
      compareOffers(
        items.map((offer) => ({
          id: offer.id,
          amountMinor: offer.price.amountMinor,
          estimatedDurationMinutes: offer.estimatedDurationMinutes ?? null,
          averageRating: offer.provider?.averageRating ?? null,
          verified: offer.provider?.isVerified ?? false,
          noteLength: offer.note?.length ?? 0,
        })),
      ).badgesByOfferId,
    [items],
  );

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
        ListHeaderComponent={
          items.length > 1 ? (
            <Text variant="bodyStrong" style={{ marginBottom: spacing.sm }}>
              {t('offer.compareTitle')}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ gap: spacing.xs }}>
            <OfferCard
              offer={item}
              onPress={() => router.push(`/customer/offers/${item.id}?jobId=${jobId}`)}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {(badgesById[item.id] ?? []).map((badge) => (
                <Badge key={badge} tone="brand" label={t(BADGE_KEYS[badge] ?? 'commerce.badge')} />
              ))}
            </View>
          </View>
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
