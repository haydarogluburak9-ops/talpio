'use client';

import { MESSAGE } from '@ustapilot/config';
import { formatDate, formatTime } from '@ustapilot/localization';
import { MessageType, type Message } from '@ustapilot/types';
import { Button, ErrorState, ListSkeleton } from '@ustapilot/ui';
import { useEffect, useRef, useState } from 'react';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import {
  useConversation,
  useMarkConversationRead,
  useSendMessage,
  useThread,
} from './use-messages';

export function ChatThread({
  conversationId,
  currentUserId,
}: {
  conversationId: string;
  currentUserId: string;
}) {
  const conversation = useConversation(conversationId);
  const thread = useThread(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const { mutate: markAsRead } = markRead;

  // Sohbet açıldığında bir kez okundu işaretlenir; sonraki mesajlar yenileme
  // döngüsüyle geldiğinde tekrar çağırmak gereksiz yazma üretirdi.
  useEffect(() => {
    if (conversationId.length > 0) markAsRead();
  }, [conversationId, markAsRead]);

  if (thread.isPending || conversation.isPending) return <ListSkeleton rows={4} />;

  if (thread.isError || conversation.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description={t('messaging.loadFailed')}
        action={{ label: t('common.retry'), onClick: () => void thread.refetch() }}
      />
    );
  }

  const other = conversation.data.participants.find((item) => item.userId !== currentUserId);
  const isClosed = conversation.data.status !== 'ACTIVE';

  return (
    <div className="flex h-[calc(100dvh-14rem)] min-h-[26rem] flex-col rounded-[--radius-card] border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <p className="font-medium text-foreground">
          {other?.displayName ?? t('messaging.chatTitle')}
        </p>
      </header>

      <MessageScroller messages={thread.data} currentUserId={currentUserId} />

      {isClosed ? (
        <p className="border-t border-border px-4 py-4 text-sm text-foreground-muted">
          {t('messaging.closed')}
        </p>
      ) : (
        <Composer conversationId={conversationId} />
      )}
    </div>
  );
}

/** Yeni mesaj geldikçe listeyi en alta kaydırır. */
function MessageScroller({
  messages,
  currentUserId,
}: {
  messages: Message[];
  currentUserId: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-foreground-muted">{t('messaging.threadEmpty')}</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {messages.map((message, index) => (
        <MessageRow
          key={message.id}
          message={message}
          previous={messages[index - 1]}
          isMine={message.senderId === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </ol>
  );
}

function MessageRow({
  message,
  previous,
  isMine,
}: {
  message: Message;
  previous: Message | undefined;
  isMine: boolean;
}) {
  const locale = publicEnv.defaultLocale;
  const showDay = !previous || !isSameDay(previous.createdAt, message.createdAt);

  if (message.type === MessageType.SYSTEM) {
    return (
      <li className="my-2 text-center text-xs text-foreground-muted">{message.body}</li>
    );
  }

  return (
    <>
      {showDay ? (
        <li className="my-2 text-center text-xs text-foreground-muted">
          {formatDate(message.createdAt, locale)}
        </li>
      ) : null}

      <li className={isMine ? 'flex justify-end' : 'flex justify-start'}>
        <div
          className={
            isMine
              ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-white'
              : 'max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-muted px-3 py-2 text-foreground'
          }
        >
          {message.body ? <p className="whitespace-pre-wrap text-sm">{message.body}</p> : null}

          {message.location ? (
            <p className="text-sm">
              {message.location.latitude.toFixed(5)}, {message.location.longitude.toFixed(5)}
            </p>
          ) : null}

          <span
            className={isMine ? 'block text-right text-[11px] text-white/70' : 'block text-right text-[11px] text-foreground-muted'}
          >
            {formatTime(message.createdAt, locale)}
          </span>
        </div>
      </li>

      {/* Uyarı yalnızca kendi mesajında gösterilir: karşı tarafı şüpheli göstermek
          yerine kullanıcıyı kendi paylaşımı konusunda uyarmak amaçlanır. */}
      {message.isFlagged && isMine ? (
        <li className="flex justify-end">
          <p className="max-w-[80%] rounded-lg bg-warning-surface px-3 py-2 text-xs text-warning-on-surface">
            {t('messaging.flaggedHint')}
          </p>
        </li>
      ) : null}
    </>
  );
}

function Composer({ conversationId }: { conversationId: string }) {
  const [body, setBody] = useState('');
  const send = useSendMessage(conversationId);

  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= MESSAGE.maxBodyLength && !send.isPending;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSend) return;

    send.mutate(
      // İstemci anahtarı ağ tekrarında aynı mesajın iki kez yazılmasını önler.
      { body: trimmed, clientMessageId: crypto.randomUUID() },
      { onSuccess: () => setBody('') },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t border-border p-3">
      {send.isError ? (
        <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger-on-surface">
          {t('messaging.sendFailed')}
        </p>
      ) : null}

      <div className="flex items-end gap-2">
        <label htmlFor="message-body" className="sr-only">
          {t('messaging.inputPlaceholder')}
        </label>
        <textarea
          id="message-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            // Enter gönderir, Shift+Enter satır atlar: sohbet ekranlarında beklenen davranış.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          rows={1}
          maxLength={MESSAGE.maxBodyLength}
          placeholder={t('messaging.inputPlaceholder')}
          className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-600 focus:outline-none"
        />
        <Button type="submit" disabled={!canSend}>
          {t('messaging.send')}
        </Button>
      </div>
    </form>
  );
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
