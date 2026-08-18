import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { SUPPORT_TICKET_STATUS_TONES } from '@talpio/config';
import { formatDateTime, supportTicketStatusLabel } from '@talpio/localization';
import { SupportTicketStatus, type SupportMessage } from '@talpio/types';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { FormField } from '@/components/form-field';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { useCloseSupportTicket, useReplySupportTicket, useSupportTicket } from './use-support';

export function TicketDetailScreen({ ticketId }: { ticketId: string }) {
  const { t, locale } = useI18n();
  const colors = useColors();
  const me = useCurrentUser();
  const ticket = useSupportTicket(ticketId);
  const reply = useReplySupportTicket(ticketId);
  const close = useCloseSupportTicket(ticketId);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (ticket.isError) {
    return (
      <Screen>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('support.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void ticket.refetch()}
        />
      </Screen>
    );
  }

  if (ticket.isPending || !ticket.data) {
    return (
      <Screen>
        <ListSkeleton rows={4} />
      </Screen>
    );
  }

  const data = ticket.data;
  const isClosed =
    data.status === SupportTicketStatus.CLOSED || data.status === SupportTicketStatus.RESOLVED;

  const sendReply = () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    reply.mutate(
      { body: trimmed, attachmentFileIds: [] },
      {
        onSuccess: () => setBody(''),
        onError: () => setError(t('support.replyFailed')),
      },
    );
  };

  const confirmClose = () => {
    Alert.alert(t('support.close'), t('support.closeConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('support.close'),
        style: 'destructive',
        onPress: () =>
          close.mutate(undefined, { onError: () => setError(t('support.closeFailed')) }),
      },
    ]);
  };

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.header}>
        <Text variant="title">{data.subject}</Text>
        <Badge
          tone={SUPPORT_TICKET_STATUS_TONES[data.status]}
          label={supportTicketStatusLabel(data.status, locale)}
        />
        {!isClosed ? (
          <Button
            label={t('support.close')}
            variant="outline"
            onPress={confirmClose}
            loading={close.isPending}
          />
        ) : null}
      </View>

      <FlatList
        data={data.messages}
        keyExtractor={(message) => message.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title={t('messaging.threadEmpty')} />}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            mine={item.senderId === me.data?.id && !item.isFromStaff}
            locale={locale}
          />
        )}
      />

      {isClosed ? (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text variant="caption" tone="muted">
            {t('support.closed')}
          </Text>
        </View>
      ) : (
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <FormField
            label={t('support.reply')}
            value={body}
            onChangeText={setBody}
            placeholder={t('support.replyPlaceholder')}
            multiline
            style={styles.reply}
            maxLength={4000}
          />
          {error ? (
            <Text variant="caption" tone="danger">
              {error}
            </Text>
          ) : null}
          <Button
            label={t('support.reply')}
            loading={reply.isPending}
            disabled={body.trim().length === 0}
            block
            onPress={sendReply}
          />
        </View>
      )}
    </Screen>
  );
}

function MessageBubble({
  message,
  mine,
  locale,
}: {
  message: SupportMessage;
  mine: boolean;
  locale: string;
}) {
  const { t } = useI18n();
  const colors = useColors();

  return (
    <View
      style={[
        styles.bubble,
        {
          alignSelf: mine ? 'flex-end' : 'flex-start',
          backgroundColor: mine ? colors.brand : colors.surfaceMuted,
        },
      ]}
    >
      <Text variant="caption" style={{ color: mine ? colors.onBrand : colors.foregroundMuted }}>
        {message.isFromStaff ? t('support.staffLabel') : t('support.youLabel')}
      </Text>
      <Text style={{ color: mine ? colors.onBrand : colors.foreground }}>{message.body}</Text>
      <Text variant="caption" style={{ color: mine ? colors.onBrand : colors.foregroundMuted }}>
        {formatDateTime(message.createdAt, locale)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm, padding: spacing.lg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reply: { minHeight: 80, textAlignVertical: 'top' },
});
