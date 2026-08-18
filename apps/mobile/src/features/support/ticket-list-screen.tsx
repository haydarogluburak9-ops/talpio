import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { SUPPORT_TICKET_STATUS_TONES } from '@talpio/config';
import { formatRelativeTime, supportTicketStatusLabel } from '@talpio/localization';
import type { SupportTicket } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

import { useSupportTickets } from './use-support';

export function TicketListScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const tickets = useSupportTickets({ limit: 50 });

  if (tickets.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('support.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void tickets.refetch()}
        />
      </Screen>
    );
  }

  if (tickets.isPending) {
    return (
      <Screen>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  const items = tickets.data.items;

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Button
          label={t('support.createCta')}
          onPress={() => router.push(`/${variant}/support/new`)}
        />
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="help-buoy-outline"
          title={t('support.empty')}
          description={t('support.emptyDescription')}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(ticket) => ticket.id}
          contentContainerStyle={styles.list}
          refreshing={tickets.isRefetching}
          onRefresh={() => void tickets.refetch()}
          renderItem={({ item }) => (
            <TicketRow
              ticket={item}
              locale={locale}
              onPress={() => router.push(`/${variant}/support/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function TicketRow({
  ticket,
  locale,
  onPress,
}: {
  ticket: SupportTicket;
  locale: string;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {ticket.subject}
          </Text>
          <Text variant="caption" tone="muted">
            {formatRelativeTime(ticket.lastMessageAt ?? ticket.createdAt, locale)}
          </Text>
        </View>
        <Badge
          tone={SUPPORT_TICKET_STATUS_TONES[ticket.status]}
          label={supportTicketStatusLabel(ticket.status, locale)}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  list: { padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
});
