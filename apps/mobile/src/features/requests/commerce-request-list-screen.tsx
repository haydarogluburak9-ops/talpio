import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useMyCommerceRequests } from './use-requests';

export function CommerceRequestListScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const list = useMyCommerceRequests();
  const items = list.data?.items ?? [];

  if (list.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void list.refetch()}
        />
      </Screen>
    );
  }

  if (list.isPending) {
    return (
      <Screen>
        <ListSkeleton rows={3} />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState title={t('commerce.myListTitle')} description={t('commerce.createDescription')} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={list.isRefetching}
        onRefresh={() => void list.refetch()}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/customer/requests/${item.id}`)}>
            <Text variant="bodyStrong">{item.title}</Text>
            <Text variant="caption" tone="muted" numberOfLines={2}>
              {item.description}
            </Text>
            <Text variant="caption" tone="muted">
              {item.status}
            </Text>
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
});
