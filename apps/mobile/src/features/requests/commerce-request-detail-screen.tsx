import { compareOffers } from '@talpio/business-logic';
import { formatMoneyMinor } from '@talpio/localization';
import { useMemo } from 'react';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useAcceptRequestOffer, useCommerceRequest, useRequestOffers } from './use-requests';

const BADGE_KEYS: Record<string, string> = {
  LOWEST_PRICE: 'offer.badgeLowestPrice',
  FASTEST_DELIVERY: 'offer.badgeFastestDelivery',
  HIGHEST_RATED: 'offer.badgeHighestRated',
  VERIFIED_BUSINESS: 'offer.badgeVerified',
  CLOSEST_SELLER: 'offer.badgeClosest',
  BEST_WARRANTY: 'offer.badgeBestWarranty',
  RESPONSE_QUALITY: 'offer.badgeResponseQuality',
};

export function CommerceRequestDetailScreen({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const me = useCurrentUser();
  const request = useCommerceRequest(id);
  const offers = useRequestOffers(id);
  const accept = useAcceptRequestOffer(id);

  const comparison = useMemo(
    () =>
      compareOffers(
        (offers.data ?? []).map((offer) => ({
          id: offer.id,
          amountMinor: offer.amountMinor,
          deliveryDays: offer.deliveryDays ?? null,
        })),
      ),
    [offers.data],
  );

  if (request.isPending) return <Screen><ListSkeleton rows={3} /></Screen>;
  if (request.isError || !request.data) {
    return (
      <Screen>
        <ErrorState title={t('commerce.notFound')} retryLabel={t('common.retry')} onRetry={() => void request.refetch()} />
      </Screen>
    );
  }

  const row = request.data;
  const isBuyer = me.data?.id === row.buyerUserId;

  return (
    <Screen onRefresh={() => void request.refetch()} refreshing={request.isRefetching}>
      <Text variant="title">{row.title}</Text>
      <Text variant="caption" tone="muted" style={{ marginBottom: spacing.md }}>
        {row.description}
      </Text>
      {row.deliveryAddressText ? (
        <Text variant="caption" tone="muted">
          {t('commerce.fieldDelivery')}: {row.deliveryAddressText}
        </Text>
      ) : null}

      <Text variant="bodyStrong" style={{ marginTop: spacing.lg }}>
        {t('offer.compareTitle')}
      </Text>
      {offers.isPending ? <ListSkeleton rows={2} /> : null}
      {offers.data?.length === 0 ? (
        <EmptyState title={t('commerce.noOffers')} />
      ) : null}
      {(offers.data ?? []).map((offer) => {
        const badges = comparison.badgesByOfferId[offer.id] ?? [];
        return (
          <Card key={offer.id}>
            <Text variant="title">
              {formatMoneyMinor(offer.amountMinor, offer.currency, locale)}
            </Text>
            <Text variant="caption" tone="muted">
              {t('commerce.delivery')}: {offer.deliveryDays ?? '—'}
            </Text>
            {offer.locationText ? (
              <Text variant="caption" tone="muted">
                {t('commerce.location')}: {offer.locationText}
              </Text>
            ) : null}
            {badges.map((badge) => (
              <Text key={badge} variant="caption">
                {t(BADGE_KEYS[badge] ?? 'commerce.badge')}
              </Text>
            ))}
            {isBuyer ? (
              <Button
                label={t('offer.accept')}
                loading={accept.isPending}
                onPress={() => accept.mutate(offer.id)}
              />
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
