import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';

import { MESSAGE } from '@ustapilot/config';
import { formatDate, formatTime } from '@ustapilot/localization';
import { ConversationStatus, MessageType, type Message } from '@ustapilot/types';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import {
  useConversation,
  useMarkConversationRead,
  useSendMessage,
  useThread,
} from './use-messages';

export function ChatScreen({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();

  const conversation = useConversation(conversationId);
  const thread = useThread(conversationId);
  const me = useCurrentUser();
  const { mutate: markAsRead } = useMarkConversationRead(conversationId);

  // Sohbet açıldığında bir kez okundu işaretlenir; yenileme döngüsüyle gelen her
  // mesajda tekrar çağırmak gereksiz yazma üretirdi.
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
      <Screen>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  const isClosed = conversation.data.status !== ConversationStatus.ACTIVE;

  return (
    <Screen scroll={false} padded={false}>
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

/**
 * Mesaj listesi.
 *
 * `inverted` kullanılır: sunucu en yeniden eskiye döndüğü için liste ters
 * çizildiğinde en güncel mesaj altta görünür ve yeni mesaj geldiğinde ekstra
 * kaydırma işine gerek kalmaz.
 */
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
          // Liste ters çizildiği için "önceki mesaj" bir sonraki dizinde durur.
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
  const colors = useColors();

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
      {/* Uyarı yalnızca kendi mesajında gösterilir: karşı tarafı şüpheli göstermek
          yerine kullanıcıyı kendi paylaşımı konusunda uyarmak amaçlanır. */}
      {message.isFlagged && isMine ? (
        <Text
          variant="caption"
          style={[
            styles.warning,
            { backgroundColor: colors.warningSurface, color: colors.warningOnSurface },
          ]}
        >
          {t('messaging.flaggedHint')}
        </Text>
      ) : null}

      <View
        style={[
          styles.bubble,
          isMine
            ? { alignSelf: 'flex-end', backgroundColor: colors.brand }
            : { alignSelf: 'flex-start', backgroundColor: colors.surfaceMuted },
        ]}
      >
        {message.body ? (
          <Text tone={isMine ? 'onBrand' : 'default'}>{message.body}</Text>
        ) : null}

        {message.location ? (
          <Text tone={isMine ? 'onBrand' : 'default'}>
            {message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}
          </Text>
        ) : null}

        <Text
          variant="caption"
          tone={isMine ? 'onBrand' : 'muted'}
          style={styles.timestamp}
        >
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
      // İstemci anahtarı ağ tekrarında aynı mesajın iki kez yazılmasını önler.
      { body: trimmed, clientMessageId: `${conversationId}-${Date.now()}` },
      { onSuccess: () => setBody('') },
    );
  }

  return (
    <View style={[styles.composer, { borderTopColor: colors.border }]}>
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
            { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface },
          ]}
        />
        <Button label={t('messaging.send')} onPress={submit} disabled={!canSend} />
      </View>
    </View>
  );
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  bubbleGroup: { gap: spacing.xs },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  timestamp: { alignSelf: 'flex-end' },
  dayLabel: { alignSelf: 'center', marginVertical: spacing.sm },
  warning: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  closed: { padding: spacing.lg },
  composer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md, gap: spacing.sm },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
