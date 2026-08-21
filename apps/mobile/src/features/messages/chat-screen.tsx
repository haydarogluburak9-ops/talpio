import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { MESSAGE } from '@talpio/config';
import { formatDate, formatTime } from '@talpio/localization';
import { ConversationStatus, MessageType, type Message } from '@talpio/types';

import { Screen } from '@/components/screen';
import { ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

import {
  useConversation,
  useMarkConversationRead,
  useSendMessage,
  useThread,
} from './use-messages';

export function ChatScreen({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const conversation = useConversation(conversationId);
  const thread = useThread(conversationId);
  const me = useCurrentUser();
  const { mutate: markAsRead } = useMarkConversationRead(conversationId);

  useEffect(() => {
    if (conversationId.length > 0) markAsRead();
  }, [conversationId, markAsRead]);

  if (thread.isError || conversation.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('messaging.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void thread.refetch()}
        />
      </Screen>
    );
  }

  if (thread.isPending || conversation.isPending) {
    return (
      <Screen scroll={false} padded={false}>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  const other = conversation.data.participants.find((item) => item.userId !== me.data?.id);
  const title = conversation.data.isGroup
    ? conversation.data.title || t('messaging.newGroup')
    : (other?.displayName ?? t('messaging.chatTitle'));
  const isClosed = conversation.data.status !== ConversationStatus.ACTIVE;

  return (
    <Screen scroll={false} padded={false}>
      <ChatHeader
        title={title}
        avatarUrl={other?.avatarUrl ?? null}
        onBack={() => router.back()}
      />

      <MessageThread messages={thread.data} currentUserId={me.data?.id ?? ''} />

      {isClosed ? (
        <View style={styles.closed}>
          <Text variant="caption" tone="muted">
            {t('messaging.closed')}
          </Text>
        </View>
      ) : (
        <Composer conversationId={conversationId} />
      )}
    </Screen>
  );
}

function ChatHeader({
  title,
  avatarUrl,
  onBack,
}: {
  title: string;
  avatarUrl: string | null;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const colors = useColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
        style={styles.backButton}
      >
        <Ionicons name="chevron-back" size={28} color={colors.foreground} />
      </Pressable>

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.headerAvatar} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.headerAvatar, styles.avatarFallback]}>
          <Text variant="caption" style={styles.avatarLetter}>
            {title.slice(0, 1).toLocaleUpperCase()}
          </Text>
        </View>
      )}

      <Text variant="bodyStrong" numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
    </View>
  );
}

function MessageThread({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: string;
}) {
  const { t } = useI18n();

  if (messages.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="caption" tone="muted">
          {t('messaging.threadEmpty')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      inverted
      data={messages}
      keyExtractor={(message) => message.id}
      contentContainerStyle={styles.list}
      renderItem={({ item, index }) => (
        <MessageBubble
          message={item}
          previous={messages[index + 1]}
          isMine={item.senderId === currentUserId}
        />
      )}
    />
  );
}

function MessageBubble({
  message,
  previous,
  isMine,
}: {
  message: Message;
  previous: Message | undefined;
  isMine: boolean;
}) {
  const { t, locale } = useI18n();

  const showDay = !previous || !isSameDay(previous.createdAt, message.createdAt);

  if (message.type === MessageType.SYSTEM) {
    return (
      <Text variant="caption" tone="muted" style={styles.dayLabel}>
        {message.body}
      </Text>
    );
  }

  return (
    <View style={styles.bubbleGroup}>
      {message.isFlagged && isMine ? (
        <Text variant="caption" style={styles.warning}>
          {t('messaging.flaggedHint')}
        </Text>
      ) : null}

      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {message.body ? (
          <Text style={isMine ? styles.textMine : styles.textTheirs}>{message.body}</Text>
        ) : null}

        {message.location ? (
          <Text style={isMine ? styles.textMine : styles.textTheirs}>
            {message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}
          </Text>
        ) : null}

        <Text variant="caption" style={[styles.timestamp, isMine ? styles.timeMine : styles.timeTheirs]}>
          {formatTime(message.createdAt, locale)}
        </Text>
      </View>

      {showDay ? (
        <Text variant="caption" tone="muted" style={styles.dayLabel}>
          {formatDate(message.createdAt, locale)}
        </Text>
      ) : null}
    </View>
  );
}

function Composer({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();
  const colors = useColors();

  const [body, setBody] = useState('');
  const send = useSendMessage(conversationId);

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MESSAGE.maxBodyLength && !send.isPending;

  function submit() {
    if (!canSend) return;

    send.mutate(
      { body: trimmed, clientMessageId: `${conversationId}-${Date.now()}` },
      { onSuccess: () => setBody('') },
    );
  }

  return (
    <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
      {send.isError ? (
        <Text variant="caption" tone="danger">
          {t('messaging.sendFailed')}
        </Text>
      ) : null}

      <View style={styles.composerRow}>
        <TextInput
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={MESSAGE.maxBodyLength}
          placeholder={t('messaging.inputPlaceholder')}
          placeholderTextColor={colors.foregroundMuted}
          accessibilityLabel={t('messaging.inputPlaceholder')}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surfaceMuted },
          ]}
        />

        {canSend ? (
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            accessibilityLabel={t('messaging.send')}
            style={styles.sendButton}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('messaging.previewPhoto')}
            style={styles.iconButton}
            disabled
          >
            <Ionicons name="camera-outline" size={24} color={colors.foregroundMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C13584',
  },
  avatarLetter: { color: '#fff', fontWeight: '700' },
  headerTitle: { flex: 1 },
  list: { padding: spacing.md, gap: spacing.xs },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  bubbleGroup: { gap: spacing.xs },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#3797F0',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 6,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFEFEF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 22,
  },
  textMine: { color: '#fff', fontSize: 15, lineHeight: 20 },
  textTheirs: { color: '#262626', fontSize: 15, lineHeight: 20 },
  timestamp: { alignSelf: 'flex-end', fontSize: 10 },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  timeTheirs: { color: '#8E8E8E' },
  dayLabel: { alignSelf: 'center', marginVertical: spacing.sm },
  warning: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    backgroundColor: '#FFF4E5',
    color: '#7A4D00',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  closed: { padding: spacing.lg },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.sm, gap: spacing.sm },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0095F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
