import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { formatRelativeTime } from '@talpio/localization';
import type { Conversation } from '@talpio/types';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { flattenConversationPages, useConversationsInfinite } from './use-messages';

export function ConversationListScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const router = useRouter();

  const conversations = useConversationsInfinite();
  const me = useCurrentUser();
  const items = flattenConversationPages(conversations.data?.pages);

  if (conversations.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('messaging.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void conversations.refetch()}
        />
      </Screen>
    );
  }

  if (conversations.isPending) {
    return (
      <Screen>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title={t('messaging.empty')}
          description={t('messaging.emptyDescription')}
        />
        <Card onPress={() => router.push(`/${variant}/messages/new-group`)}>
          <Text variant="bodyStrong">{t('messaging.newGroup')}</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.toolbar}>
        <Text variant="title">{t('messaging.listTitle')}</Text>
        <Card onPress={() => router.push(`/${variant}/messages/new-group`)}>
          <Text variant="caption">{t('messaging.newGroup')}</Text>
        </Card>
      </View>
      <FlatList
        data={items}
        keyExtractor={(conversation) => conversation.id}
        contentContainerStyle={styles.list}
        refreshing={conversations.isRefetching}
        onRefresh={() => void conversations.refetch()}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (conversations.hasNextPage && !conversations.isFetchingNextPage) {
            void conversations.fetchNextPage();
          }
        }}
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            currentUserId={me.data?.id ?? ''}
            onPress={() => router.push(`/${variant}/chat/${item.id}`)}
          />
        )}
      />
    </Screen>
  );
}

function ConversationRow({
  conversation,
  currentUserId,
  onPress,
}: {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}) {
  const { t, locale } = useI18n();
  const colors = useColors();

  const other = conversation.participants.find((item) => item.userId !== currentUserId);
  const preview = conversation.lastMessage;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.body}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {conversation.isGroup
              ? conversation.title || t('messaging.newGroup')
              : (other?.displayName ?? t('messaging.chatTitle'))}
          </Text>
          <Text
            variant="caption"
            tone={hasUnread ? 'default' : 'muted'}
            numberOfLines={1}
          >
            {preview?.body ?? t('messaging.threadEmpty')}
          </Text>
        </View>

        <View style={styles.meta}>
          {preview ? (
            <Text variant="caption" tone="muted">
              {formatRelativeTime(preview.createdAt, locale)}
            </Text>
          ) : null}
          {hasUnread ? (
            <Text
              variant="caption"
              accessibilityLabel={`${conversation.unreadCount} ${t('messaging.unreadCount')}`}
              style={[styles.badge, { backgroundColor: colors.brand, color: colors.onBrand }]}
            >
              {conversation.unreadCount}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  body: { flex: 1, gap: spacing.xs },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    overflow: 'hidden',
    fontWeight: '700',
  },
});
