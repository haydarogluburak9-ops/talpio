import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

import { formatRelativeTime } from '@talpio/localization';
import type { Conversation } from '@talpio/types';

import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import { formatMessagePreview } from './message-ui';
import { flattenConversationPages, useConversationsInfinite } from './use-messages';

export function ConversationListScreen({ variant }: { variant: 'customer' | 'provider' }) {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();

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
      <Screen scroll={false} padded={false}>
        <InboxHeader
          onCompose={() => router.push(`/${variant}/messages/new-group`)}
        />
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen scroll={false} padded={false}>
        <InboxHeader
          onCompose={() => router.push(`/${variant}/messages/new-group`)}
        />
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title={t('messaging.empty')}
          description={t('messaging.emptyDescription')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <InboxHeader onCompose={() => router.push(`/${variant}/messages/new-group`)} />
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
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border }]} />
        )}
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

function InboxHeader({ onCompose }: { onCompose: () => void }) {
  const { t } = useI18n();

  return (
    <View style={styles.header}>
      <Text variant="title">{t('messaging.listTitle')}</Text>
      <Pressable
        onPress={onCompose}
        accessibilityRole="button"
        accessibilityLabel={t('messaging.newGroup')}
        hitSlop={8}
        style={styles.composeButton}
      >
        <Ionicons name="create-outline" size={26} color="#262626" />
      </Pressable>
    </View>
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
  const title = conversation.isGroup
    ? conversation.title || t('messaging.newGroup')
    : (other?.displayName ?? t('messaging.chatTitle'));

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.avatarWrap}>
        <Avatar name={title} url={other?.avatarUrl ?? null} />
        {hasUnread ? <View style={styles.unreadDot} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" numberOfLines={1} style={hasUnread ? styles.unreadTitle : undefined}>
            {title}
          </Text>
          {preview ? (
            <Text
              variant="caption"
              style={[styles.time, hasUnread ? styles.unreadTime : { color: colors.foregroundMuted }]}
            >
              {formatRelativeTime(preview.createdAt, locale)}
            </Text>
          ) : null}
        </View>
        <Text
          variant="caption"
          tone={hasUnread ? 'default' : 'muted'}
          numberOfLines={1}
          style={hasUnread ? styles.unreadPreview : undefined}
        >
          {formatMessagePreview(preview, currentUserId, t)}
        </Text>
      </View>
    </Pressable>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.avatar} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text variant="bodyStrong" style={styles.avatarLetter}>
        {name.slice(0, 1).toLocaleUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingBottom: spacing['3xl'] },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 88 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C13584',
  },
  avatarLetter: { color: '#fff' },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0095F6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  time: { flexShrink: 0 },
  unreadTime: { color: '#0095F6', fontWeight: '600' },
  unreadTitle: { fontWeight: '700' },
  unreadPreview: { fontWeight: '500' },
});
