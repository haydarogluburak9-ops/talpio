import { compareOffers } from '@talpio/business-logic';
import { formatMoneyMinor } from '@talpio/localization';
import { useMemo } from 'react';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { JobPhotos } from '@/features/jobs/job-photos';
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
      <JobPhotos
        attachments={(row.photos ?? []).map((photo) => ({
          id: photo.id,
          fileId: photo.id,
          url: photo.url,
          mimeType: 'image/jpeg',
          sizeBytes: 0,
          sortOrder: 0,
        }))}
      />

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
            {offer.brand ? (
              <Text variant="caption" tone="muted">
                {t('offer.brand')}: {offer.brand}
              </Text>
            ) : null}
            {offer.model ? (
              <Text variant="caption" tone="muted">
                {t('offer.model')}: {offer.model}
              </Text>
            ) : null}
            <Text variant="caption" tone="muted">
              {t('commerce.delivery')}:{' '}
              {offer.deliveryDays != null
                ? t('offer.validityDaysValue', { count: offer.deliveryDays })
                : '—'}
            </Text>
            {offer.shippingIncluded != null ? (
              <Text variant="caption" tone="muted">
                {t('commerce.shipping')}:{' '}
                {offer.shippingIncluded
                  ? t('social.shippingIncludedYes')
                  : t('social.shippingIncludedNo')}
              </Text>
            ) : null}
            {offer.locationText ? (
              <Text variant="caption" tone="muted">
                {t('commerce.location')}: {offer.locationText}
              </Text>
            ) : null}
            {offer.note ? (
              <Text variant="caption">
                {t('commerce.contents')}: {offer.note}
              </Text>
            ) : null}
            <JobPhotos
              attachments={(offer.photos ?? []).map((photo) => ({
                id: photo.id,
                fileId: photo.id,
                url: photo.url,
                mimeType: 'image/jpeg',
                sizeBytes: 0,
                sortOrder: 0,
              }))}
            />
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
