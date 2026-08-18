import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { nextJobStatuses } from '@talpio/business-logic';
import { formatDate, formatMoney } from '@talpio/localization';
import { JobRequestStatus, OfferStatus, type Offer } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/state-views';
import { OfferStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useJob } from '@/features/jobs/use-jobs';
import { useAcceptOffer, useOffer, useRejectOffer } from '@/features/offers/use-offers';
import { useI18n } from '@/lib/i18n';
import { useNow } from '@/lib/use-now';
import { spacing } from '@/theme/tokens';

/**
 * Müşterinin teklif detayı ve karar ekranı. Kabul edilen teklif talebi de
 * kilitler; bu yüzden onay bir ara adımla alınır.
 */
export default function CustomerOfferDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const offer = useOffer(params.id ?? '');

  if (offer.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void offer.refetch()}
        />
      </Screen>
    );
  }

  if (!offer.data) {
    return (
      <Screen>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  return (
    <OfferDetailContent
      offer={offer.data}
      onRefresh={() => void offer.refetch()}
      refreshing={offer.isRefetching}
    />
  );
}

function OfferDetailContent({
  offer,
  onRefresh,
  refreshing,
}: {
  offer: Offer;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const job = useJob(offer.jobRequestId);
  const acceptOffer = useAcceptOffer(offer.jobRequestId);
  const rejectOffer = useRejectOffer(offer.jobRequestId);
  const [confirming, setConfirming] = useState(false);

  const now = useNow();
  const provider = offer.provider;
  const isExpired = new Date(offer.validUntil).getTime() <= now;

  // Satıcı seçildikten sonra karar düğmeleri kapanır; kural iş mantığındadır.
  const jobAcceptsOffers = job.data
    ? nextJobStatuses(job.data.status).includes(JobRequestStatus.PROVIDER_SELECTED)
    : false;
  const canDecide = offer.status === OfferStatus.SUBMITTED && !isExpired && jobAcceptsOffers;
  const isDeciding = acceptOffer.isPending || rejectOffer.isPending;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card>
        <View style={styles.header}>
          <Text variant="title" style={styles.flex}>
            {provider?.displayName ?? t('offer.detailTitle')}
          </Text>
          <OfferStatusPill status={offer.status} locale={locale} />
        </View>

        <Text variant="caption" tone="muted">
          {provider?.averageRating != null
            ? `${provider.averageRating.toFixed(1)} · ${provider.reviewCount} ${t('offer.reviewCount')} · ${provider.completedJobCount} ${t('offer.completedJobs')}`
            : t('offer.noRating')}
        </Text>

        <View style={styles.badges}>
          {provider?.isVerified ? <Badge tone="success" label={t('provider.verified')} /> : null}
          {provider?.isPremium ? <Badge tone="accent" label={t('provider.rating')} /> : null}
        </View>
      </Card>

      <Card>
        <Text variant="title">{formatMoney(offer.price, locale)}</Text>
        <Badge tone="neutral" label={t(`offerPriceType.${offer.priceType}`)} />

        {offer.note ? <Text variant="body">{offer.note}</Text> : null}

        <DetailRow
          label={t('offer.estimatedDuration')}
          value={offer.estimatedDurationMinutes ? `${offer.estimatedDurationMinutes} dk` : '—'}
        />
        <DetailRow
          label={t('offer.availableFrom')}
          value={offer.availableFrom ? formatDate(offer.availableFrom, locale) : '—'}
        />
        <DetailRow
          label={t('offer.validity')}
          value={isExpired ? t('offer.expiredNote') : formatDate(offer.validUntil, locale)}
        />
        <DetailRow
          label={t('job.materialsIncluded')}
          value={offer.materialsIncluded ? t('common.yes') : t('common.no')}
        />
      </Card>

      {job.data ? (
        <Card onPress={() => router.push(`/customer/jobs/${job.data.id}`)}>
          <Text variant="caption" tone="muted">
            {t('offer.forJob')}
          </Text>
          <Text variant="bodyStrong">{job.data.title}</Text>
        </Card>
      ) : null}

      {canDecide ? (
        <Card>
          {acceptOffer.isError || rejectOffer.isError ? (
            <Text variant="caption" tone="danger">
              {t('status.errorMessage')}
            </Text>
          ) : null}

          {confirming ? (
            <View style={styles.confirm}>
              <Text variant="caption">{t('offer.acceptConfirm')}</Text>
              <Button
                label={t('offer.acceptConfirmAction')}
                loading={acceptOffer.isPending}
                onPress={() => acceptOffer.mutate(offer.id)}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => setConfirming(false)}
              />
            </View>
          ) : (
            <View style={styles.confirm}>
              <Button
                label={t('offer.accept')}
                disabled={isDeciding}
                onPress={() => setConfirming(true)}
              />
              <Button
                label={t('offer.reject')}
                variant="ghost"
                size="sm"
                loading={rejectOffer.isPending}
                onPress={() => rejectOffer.mutate({ offerId: offer.id })}
              />
            </View>
          )}
        </Card>
      ) : offer.status === OfferStatus.SUBMITTED && !jobAcceptsOffers ? (
        <Card>
          <Text variant="caption" tone="muted">
            {t('offer.jobLocked')}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="caption" tone="muted" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="caption" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowLabel: { flex: 1 },
  rowValue: { flex: 1.4, textAlign: 'right' },
  confirm: { gap: spacing.sm },
});
