import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { formatDate, formatMoney } from '@talpio/localization';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ErrorState, LoadingState } from '@/components/state-views';
import { JobStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { JobPhotos } from '@/features/jobs/job-photos';
import { useJob } from '@/features/jobs/use-jobs';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/**
 * Satıcının gördüğü talep detayı. Açık adres backend tarafından maskelenir;
 * burada yalnızca ilçe/şehir gösterilir ve nedeni kullanıcıya belirtilir.
 */
export default function ProviderJobDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { t, locale, categoryName } = useI18n();
  const router = useRouter();
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

  const data = job.data;

  return (
    <Screen onRefresh={() => void job.refetch()} refreshing={job.isRefetching}>
      <Card>
        <View style={styles.header}>
          <Text variant="title" style={styles.flex}>
            {data.title}
          </Text>
          <JobStatusPill status={data.status} locale={locale} />
        </View>

        <Text variant="caption" tone="muted">
          {categoryName(data.category)}
          {data.subcategory ? ` · ${categoryName(data.subcategory)}` : ''} ·{' '}
          {data.address.districtName},{' '}
          {data.address.cityName}
        </Text>

        <Text variant="body">{data.description}</Text>

        <View style={styles.badges}>
          {data.isUrgent ? <Badge tone="danger" label={t('job.urgent')} /> : null}
          {data.inspectionRequired ? (
            <Badge tone="info" label={t('job.inspectionRequired')} />
          ) : null}
          {data.materialsIncluded ? <Badge tone="info" label={t('job.materialsIncluded')} /> : null}
          <Badge tone="neutral" label={t(`jobSize.${data.size}`)} />
        </View>

        <JobPhotos attachments={data.attachments} />
      </Card>

      <Card>
        <Text variant="bodyStrong">{t('job.infoTitle')}</Text>
        <DetailRow
          label={t('job.budget')}
          value={data.budget ? formatMoney(data.budget, locale) : '—'}
        />
        <DetailRow
          label={t('job.preferredDay')}
          value={data.preferredDate ? formatDate(data.preferredDate, locale) : t('job.flexibleDate')}
        />
        <DetailRow
          label={t('job.preferredTime')}
          value={t(`jobTimeSlot.${data.preferredTimeSlot}`)}
        />
        <DetailRow
          label={t('job.expiresAt')}
          value={data.expiresAt ? formatDate(data.expiresAt, locale) : '—'}
        />
        <DetailRow label={t('job.address')} value={t('job.addressHidden')} />
      </Card>

      <Button
        label={t('offer.createTitle')}
        onPress={() => router.push(`/provider/offers/new?jobId=${data.id}`)}
      />
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
});
