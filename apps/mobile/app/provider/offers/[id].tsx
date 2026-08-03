import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney } from '@ustapilot/localization';
import { OfferStatus } from '@ustapilot/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/state-views';
import { OfferStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useJob } from '@/features/jobs/use-jobs';
import { useOffer, useWithdrawOffer } from '@/features/offers/use-offers';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/** Ustanın kendi teklifinin detayı. Yalnızca bekleyen teklif geri çekilebilir. */
export default function ProviderOfferDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const router = useRouter();

  const offer = useOffer(params.id ?? '');
  const job = useJob(offer.data?.jobRequestId ?? '');
  const withdrawOffer = useWithdrawOffer();
  const [confirming, setConfirming] = useState(false);

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

  const data = offer.data;
  const canWithdraw = data.status === OfferStatus.SUBMITTED;

  return (
    <Screen onRefresh={() => void offer.refetch()} refreshing={offer.isRefetching}>
      <Card>
        <View style={styles.header}>
          <Text variant="title" style={styles.flex}>
            {formatMoney(data.price, locale)}
          </Text>
          <OfferStatusPill status={data.status} locale={locale} />
        </View>

        <Badge tone="neutral" label={t(`offerPriceType.${data.priceType}`)} />

        {data.note ? <Text variant="body">{data.note}</Text> : null}

        <DetailRow
          label={t('offer.estimatedDuration')}
          value={data.estimatedDurationMinutes ? `${data.estimatedDurationMinutes} dk` : '—'}
        />
        <DetailRow
          label={t('offer.availableFrom')}
          value={data.availableFrom ? formatDate(data.availableFrom, locale) : '—'}
        />
        <DetailRow label={t('offer.validity')} value={formatDate(data.validUntil, locale)} />
        <DetailRow
          label={t('job.materialsIncluded')}
          value={data.materialsIncluded ? t('common.yes') : t('common.no')}
        />
      </Card>

      {job.data ? (
        <Card onPress={() => router.push(`/provider/jobs/${job.data.id}`)}>
          <Text variant="caption" tone="muted">
            {t('offer.forJob')}
          </Text>
          <Text variant="bodyStrong">{job.data.title}</Text>
          <Text variant="caption" tone="muted">
            {job.data.category.name} · {job.data.address.districtName}, {job.data.address.cityName}
          </Text>
        </Card>
      ) : null}

      {canWithdraw ? (
        <Card>
          {withdrawOffer.isError ? (
            <Text variant="caption" tone="danger">
              {t('status.errorMessage')}
            </Text>
          ) : null}

          {confirming ? (
            <View style={styles.confirm}>
              <Text variant="caption">{t('offer.withdrawConfirm')}</Text>
              <Button
                label={t('offer.withdrawConfirmAction')}
                variant="danger"
                size="sm"
                loading={withdrawOffer.isPending}
                onPress={() => withdrawOffer.mutate(data.id)}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                size="sm"
                onPress={() => setConfirming(false)}
              />
            </View>
          ) : (
            <Button
              label={t('offer.withdraw')}
              variant="outline"
              size="sm"
              onPress={() => setConfirming(true)}
            />
          )}
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
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowLabel: { flex: 1 },
  rowValue: { flex: 1.4, textAlign: 'right' },
  confirm: { gap: spacing.sm },
});
