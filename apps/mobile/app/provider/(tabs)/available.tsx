import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { JobCard } from '@/features/jobs/job-card';
import { flattenPages, useAvailableJobsInfinite } from '@/features/jobs/use-jobs';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function ProviderAvailableJobsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();

  // Varsayılan olarak satıcının kendi hizmet alanı; kapatınca tüm havuz görünür.
  const [matchMyServices, setMatchMyServices] = useState(true);
  const jobs = useAvailableJobsInfinite({ matchMyServices });
  const items = flattenPages(jobs.data?.pages);

  const filterRow = (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: matchMyServices }}
      onPress={() => setMatchMyServices((current) => !current)}
      style={styles.filterWrap}
    >
      <Text
        variant="caption"
        style={[
          styles.filterChip,
          {
            backgroundColor: matchMyServices ? colors.brand : colors.surfaceMuted,
            color: matchMyServices ? colors.onBrand : colors.foregroundMuted,
          },
        ]}
      >
        {t('provider.myServices')}
      </Text>
    </Pressable>
  );

  if (jobs.isError) {
    const isProfileMissing =
      jobs.error instanceof ApiError && jobs.error.code === 'PROVIDER_PROFILE_INCOMPLETE';

    return (
      <Screen>
        <ErrorState
          title={isProfileMissing ? t('provider.profileTitle') : t('status.errorTitle')}
          description={
            isProfileMissing
              ? t('provider.serviceAreasHint')
              : jobs.error instanceof ApiError
                ? jobs.error.message
                : t('status.errorMessage')
          }
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
          icon="search-outline"
          title={t('status.empty')}
          description={t('provider.serviceAreasHint')}
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
        ListHeaderComponent={<View style={styles.header}>{filterRow}</View>}
        refreshing={jobs.isRefetching}
        onRefresh={() => void jobs.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (jobs.hasNextPage && !jobs.isFetchingNextPage) void jobs.fetchNextPage();
        }}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            variant="provider"
            onPress={() => router.push(`/provider/jobs/${item.id}`)}
          />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  header: { marginBottom: spacing.xs },
  filterWrap: { alignSelf: 'flex-start' },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
    fontWeight: '600',
  },
});
