import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { nextJobStatuses } from '@talpio/business-logic';
import { formatDate, formatMoney } from '@talpio/localization';
import { JobRequestStatus, type JobRequest } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/state-views';
import { JobStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { JobPhotos } from '@/features/jobs/job-photos';
import { useCancelJob, useJob } from '@/features/jobs/use-jobs';
import { useOrderForJob } from '@/features/orders/use-orders';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/** Bu durumlarda satıcı seçilmiştir; artık takip edilecek bir sipariş vardır. */
const HAS_ORDER: JobRequestStatus[] = [
  JobRequestStatus.PROVIDER_SELECTED,
  JobRequestStatus.SCHEDULED,
  JobRequestStatus.PROVIDER_EN_ROUTE,
  JobRequestStatus.IN_PROGRESS,
  JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
  JobRequestStatus.COMPLETED,
];

export default function JobDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const job = useJob(params.id ?? '');

  if (job.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void job.refetch()}
        />
      </Screen>
    );
  }

  if (!job.data) {
    return (
      <Screen>
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  return <JobDetailContent job={job.data} onRefresh={() => void job.refetch()} refreshing={job.isRefetching} />;
}

function JobDetailContent({
  job,
  onRefresh,
  refreshing,
}: {
  job: JobRequest;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cancelJob = useCancelJob(job.id);
  const [confirming, setConfirming] = useState(false);

  const canCancel = nextJobStatuses(job.status).includes(JobRequestStatus.CANCELLED);
  // Sorgu sonucu yerel değişkene alınır; `order.data` üzerinden okumak daraltmayı
  // geri çevirir ve tür kontrolü null olasılığını yeniden gündeme getirir.
  const order = useOrderForJob(job.id, HAS_ORDER.includes(job.status)).data;

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card>
        <View style={styles.header}>
          <Text variant="title" style={styles.flex}>
            {job.title}
          </Text>
          <JobStatusPill status={job.status} locale={locale} />
        </View>

        <Text variant="caption" tone="muted">
          {job.category.name}
          {job.subcategory ? ` · ${job.subcategory.name}` : ''} · {job.address.districtName},{' '}
          {job.address.cityName}
        </Text>

        <Text variant="body">{job.description}</Text>

        <View style={styles.badges}>
          {job.isUrgent ? <Badge tone="danger" label={t('job.urgent')} /> : null}
          {job.inspectionRequired ? <Badge tone="info" label={t('job.inspectionRequired')} /> : null}
          {job.materialsIncluded ? <Badge tone="info" label={t('job.materialsIncluded')} /> : null}
        </View>

        <JobPhotos attachments={job.attachments} />
      </Card>

      <Card>
        <Text variant="bodyStrong">{t('job.infoTitle')}</Text>

        <DetailRow
          label={t('job.budget')}
          value={job.budget ? formatMoney(job.budget, locale) : '—'}
        />
        <DetailRow label={t('job.size')} value={t(`jobSize.${job.size}`)} />
        <DetailRow
          label={t('job.preferredDay')}
          value={job.preferredDate ? formatDate(job.preferredDate, locale) : t('job.flexibleDate')}
        />
        <DetailRow
          label={t('job.preferredTime')}
          value={t(`jobTimeSlot.${job.preferredTimeSlot}`)}
        />
        <DetailRow label={t('job.createdAt')} value={formatDate(job.createdAt, locale)} />
        <DetailRow
          label={t('job.expiresAt')}
          value={job.expiresAt ? formatDate(job.expiresAt, locale) : '—'}
        />
        <DetailRow
          label={t('job.address')}
          value={
            job.address.addressLine ??
            `${job.address.districtName}, ${job.address.cityName}`
          }
        />
      </Card>

      {order ? (
        <Card onPress={() => router.push(`/customer/orders/${order.id}`)}>
          <Text variant="bodyStrong">{t('order.detailTitle')}</Text>
          <Text variant="caption" tone="muted">
            {t(`orderStatus.${order.status}`)}
          </Text>
          <Text variant="caption" tone="brand">
            {t('order.listTitle')}
          </Text>
        </Card>
      ) : null}

      <Card onPress={job.offerCount > 0 ? () => router.push(`/customer/jobs/${job.id}/offers`) : undefined}>
        <Text variant="bodyStrong">{t('job.offersTitle')}</Text>
        <Text variant="caption" tone="muted">
          {job.offerCount > 0 ? t('job.offerCount', { count: job.offerCount }) : t('job.noOffers')}
        </Text>
        {job.offerCount > 0 ? (
          <Text variant="caption" tone="brand">
            {t('offer.compareTitle')}
          </Text>
        ) : null}
      </Card>

      {canCancel ? (
        <Card>
          {cancelJob.isError ? (
            <Text variant="caption" tone="danger">
              {t('status.errorMessage')}
            </Text>
          ) : null}

          {confirming ? (
            <View style={styles.confirm}>
              <Text variant="caption">{t('job.cancelConfirm')}</Text>
              <Button
                label={t('job.cancelConfirmAction')}
                variant="danger"
                size="sm"
                loading={cancelJob.isPending}
                onPress={() => cancelJob.mutate(undefined)}
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
              label={t('job.cancelRequest')}
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  rowLabel: { flex: 1 },
  rowValue: { flex: 1.4, textAlign: 'right' },
  confirm: { gap: spacing.sm },
});
