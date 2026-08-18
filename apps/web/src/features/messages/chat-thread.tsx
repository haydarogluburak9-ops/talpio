'use client';

import { MESSAGE } from '@talpio/config';
import { formatDate, formatTime } from '@talpio/localization';
import { FilePurpose, MessageType, type Message } from '@talpio/types';
import { Button, ErrorState, ListSkeleton } from '@talpio/ui';
import { Mic } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
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
    <div className="social-panel flex h-[calc(100dvh-14rem)] min-h-[26rem] flex-col overflow-hidden">
      <header className="border-b border-border/70 bg-brand-900 px-4 py-3 text-white">
        <p className="font-semibold tracking-tight">
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

          {message.type === MessageType.VOICE ||
          message.attachments.some((item) => item.mimeType.startsWith('audio/')) ? (
            <div className="mt-1 space-y-1">
              <p className="text-xs opacity-80">{t('messaging.voiceMessage')}</p>
              {message.attachments
                .filter((item) => item.mimeType.startsWith('audio/'))
                .map((item) => (
                  <audio key={item.id} controls preload="metadata" className="max-w-full">
                    <source src={item.url} type={item.mimeType} />
                  </audio>
                ))}
            </div>
          ) : null}

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
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const send = useSendMessage(conversationId);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
        void sendVoice(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setVoiceError(t('messaging.micDenied'));
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setRecording(false);
      return;
    }
    recorder.stop();
    setRecording(false);
  }

  async function sendVoice(blob: Blob) {
    if (blob.size < 500) return;
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, {
        type: blob.type || 'audio/webm',
      });
      const uploaded = await apiClient.files.upload(file, FilePurpose.MESSAGE_ATTACHMENT);
      await send.mutateAsync({
        type: MessageType.VOICE,
        attachmentFileIds: [uploaded.id],
        clientMessageId: crypto.randomUUID(),
      });
    } catch {
      setVoiceError(t('messaging.sendFailed'));
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t border-border p-3">
      {send.isError || voiceError ? (
        <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger-on-surface">
          {voiceError ?? t('messaging.sendFailed')}
        </p>
      ) : null}

      {recording ? (
        <p className="text-xs font-medium text-accent-600">{t('messaging.recording')}</p>
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label={t('messaging.holdToRecord')}
          title={t('messaging.holdToRecord')}
          onPointerDown={(event) => {
            event.preventDefault();
            void startRecording();
          }}
          onPointerUp={() => stopRecording()}
          onPointerLeave={() => {
            if (recording) stopRecording();
          }}
          onPointerCancel={() => stopRecording()}
          className={
            recording
              ? 'grid size-11 place-items-center rounded-full bg-accent-500 text-white'
              : 'grid size-11 place-items-center rounded-full border border-border bg-surface text-foreground-muted hover:bg-surface-muted'
          }
        >
          <Mic className="size-5" aria-hidden />
        </button>
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
