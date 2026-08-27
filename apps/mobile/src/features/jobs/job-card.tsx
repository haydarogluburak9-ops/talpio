import { StyleSheet, View } from 'react-native';

import { formatMoney, formatRelativeTime } from '@talpio/localization';
import type { JobRequest } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import { JobStatusPill } from '@/components/status-pill';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

export interface JobCardProps {
  job: JobRequest;
  onPress: () => void;
  /** Satıcı havuzunda teklif sayısı yerine bütçe öne çıkar. */
  variant?: 'customer' | 'provider';
}

export function JobCard({ job, onPress, variant = 'customer' }: JobCardProps) {
  const { t, locale, categoryName } = useI18n();

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text variant="bodyStrong" numberOfLines={2} style={styles.title}>
          {job.title}
        </Text>
        <JobStatusPill status={job.status} locale={locale} />
      </View>

      <Text variant="caption" tone="muted">
        {categoryName(job.category)} · {job.address.districtName}, {job.address.cityName}
      </Text>

      <Text variant="caption" tone="muted" numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.meta}>
        {job.isUrgent ? <Badge tone="danger" label={t('job.urgent')} /> : null}
        {job.budget ? <Badge tone="neutral" label={formatMoney(job.budget, locale)} /> : null}
        {variant === 'customer' ? (
          <Badge
            tone={job.offerCount > 0 ? 'brand' : 'neutral'}
            label={
              job.offerCount > 0 ? t('job.offerCount', { count: job.offerCount }) : t('job.noOffers')
            }
          />
        ) : null}
      </View>

      <Text variant="caption" tone="muted">
        {formatRelativeTime(job.publishedAt ?? job.createdAt, locale)}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title: { flex: 1 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
