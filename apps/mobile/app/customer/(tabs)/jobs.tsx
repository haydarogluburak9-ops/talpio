import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { JobRequestStatus } from '@ustapilot/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { JobCard } from '@/features/jobs/job-card';
import { flattenPages, useMyJobsInfinite } from '@/features/jobs/use-jobs';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

/** Müşterinin gerçekten ayırdığı üç küme; ham durum listesi çok uzun. */
const FILTERS = [
  { id: 'all', status: undefined },
  {
    id: 'open',
    status: [
      JobRequestStatus.DRAFT,
      JobRequestStatus.PUBLISHED,
      JobRequestStatus.OFFERS_RECEIVED,
      JobRequestStatus.PROVIDER_SELECTED,
      JobRequestStatus.SCHEDULED,
      JobRequestStatus.PROVIDER_EN_ROUTE,
      JobRequestStatus.IN_PROGRESS,
      JobRequestStatus.AWAITING_CUSTOMER_APPROVAL,
    ],
  },
  { id: 'closed', status: [JobRequestStatus.COMPLETED, JobRequestStatus.CANCELLED] },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

export default function CustomerJobsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();

  const [filterId, setFilterId] = useState<FilterId>('all');
  const filter = FILTERS.find((item) => item.id === filterId) ?? FILTERS[0];

  const jobs = useMyJobsInfinite(filter.status ? { status: [...filter.status] } : {});
  const items = flattenPages(jobs.data?.pages);

  const filterRow = (
    <View style={styles.filters}>
      {FILTERS.map((item) => {
        const selected = item.id === filterId;
        return (
          <Text
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => setFilterId(item.id)}
            variant="caption"
            style={[
              styles.filterChip,
              {
                backgroundColor: selected ? colors.brand : colors.surfaceMuted,
                color: selected ? colors.onBrand : colors.foregroundMuted,
              },
            ]}
          >
            {t(`jobFilter.${item.id}`)}
          </Text>
        );
      })}
    </View>
  );

  if (jobs.isError) {
    return (
      <Screen>
        {filterRow}
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void jobs.refetch()}
        />
      </Screen>
    );
  }

  if (jobs.isPending) {
    return (
      <Screen>
        {filterRow}
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        {filterRow}
        <EmptyState
          icon="clipboard-outline"
          title={t('status.emptyJobs')}
          description={t('home.stepRequestBody')}
          actionLabel={t('nav.newRequest')}
          onAction={() => router.push('/customer/jobs/new')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(job) => job.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={filterRow}
        refreshing={jobs.isRefetching}
        onRefresh={() => void jobs.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (jobs.hasNextPage && !jobs.isFetchingNextPage) void jobs.fetchNextPage();
        }}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => router.push(`/customer/jobs/${item.id}`)} />
        )}
        ListFooterComponent={
          jobs.isFetchingNextPage ? (
            <Card>
              <Text variant="caption" tone="muted">
                {t('common.loading')}
              </Text>
            </Card>
          ) : null
        }
      />

      <View style={styles.floating}>
        <Button
          label={t('nav.newRequest')}
          block
          onPress={() => router.push('/customer/jobs/new')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] * 2 },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
    fontWeight: '600',
  },
  floating: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
