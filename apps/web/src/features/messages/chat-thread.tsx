'use client';

import { MESSAGE } from '@talpio/config';
import { formatDate, formatTime } from '@talpio/localization';
import { FilePurpose, MessageType, type Message } from '@talpio/types';
import { ErrorState, ListSkeleton, cn } from '@talpio/ui';
import { ArrowLeft, Camera, Mic, SendHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
import { t, getLocale } from '@/lib/i18n';

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
  const title = conversation.data.isGroup
    ? conversation.data.title || t('messaging.newGroup')
    : (other?.displayName ?? t('messaging.chatTitle'));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
      <ChatHeader title={title} avatarUrl={other?.avatarUrl ?? null} />

      <MessageScroller messages={thread.data} currentUserId={currentUserId} />

      {isClosed ? (
        <p className="border-t border-border px-4 py-3 text-center text-sm text-foreground-muted">
          {t('messaging.closed')}
        </p>
      ) : (
        <Composer conversationId={conversationId} />
      )}
    </div>
  );
}

function ChatHeader({ title, avatarUrl }: { title: string; avatarUrl: string | null }) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border/70 px-3 py-2.5">
      <Link
        href="/mesajlar"
        className="grid size-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface-muted lg:hidden"
        aria-label={t('messaging.listTitle')}
      >
        <ArrowLeft className="size-5" aria-hidden />
      </Link>

      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-9 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-sm font-semibold text-white"
        >
          {title.slice(0, 1).toLocaleUpperCase()}
        </span>
      )}

      <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{title}</p>
    </header>
  );
}

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
    <ol className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-3">
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
  const locale = getLocale();
  const showDay = !previous || !isSameDay(previous.createdAt, message.createdAt);

  if (message.type === MessageType.SYSTEM) {
    return (
      <li className="my-3 text-center text-xs font-medium text-foreground-muted">{message.body}</li>
    );
  }

  return (
    <>
      {showDay ? (
        <li className="my-3 text-center text-xs font-medium text-foreground-muted">
          {formatDate(message.createdAt, locale)}
        </li>
      ) : null}

      <li className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
        <div
          className={cn(
            'max-w-[75%] px-3.5 py-2 text-[15px] leading-snug',
            isMine
              ? 'rounded-[22px] rounded-br-md bg-[#3797F0] text-white'
              : 'rounded-[22px] rounded-bl-md bg-[#EFEFEF] text-foreground dark:bg-surface-muted',
          )}
        >
          {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}

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
            className={cn(
              'mt-0.5 block text-right text-[10px]',
              isMine ? 'text-white/75' : 'text-foreground-muted',
            )}
          >
            {formatTime(message.createdAt, locale)}
          </span>
        </div>
      </li>

      {message.isFlagged && isMine ? (
        <li className="flex justify-end">
          <p className="max-w-[75%] rounded-lg bg-warning-surface px-3 py-2 text-xs text-warning-on-surface">
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

  function submit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!canSend) return;

    send.mutate(
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
    <form
      onSubmit={submit}
      className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-surface px-3 py-2.5"
    >
      {send.isError || voiceError ? (
        <p role="alert" className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger-on-surface">
          {voiceError ?? t('messaging.sendFailed')}
        </p>
      ) : null}

      {recording ? (
        <p className="text-center text-xs font-medium text-[#0095F6]">{t('messaging.recording')}</p>
      ) : null}

      <div className="flex items-end gap-2">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center text-foreground-muted"
          aria-label={t('messaging.previewPhoto')}
          disabled
        >
          <Camera className="size-6" aria-hidden />
        </button>

        <label htmlFor="message-body" className="sr-only">
          {t('messaging.inputPlaceholder')}
        </label>
        <textarea
          id="message-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={MESSAGE.maxBodyLength}
          placeholder={t('messaging.inputPlaceholder')}
          className="max-h-28 min-h-10 flex-1 resize-none rounded-full border border-border bg-surface-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-[#0095F6] focus:outline-none"
        />

        {canSend ? (
          <button
            type="submit"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0095F6] text-white transition-opacity hover:opacity-90"
            aria-label={t('messaging.send')}
          >
            <SendHorizontal className="size-5" aria-hidden />
          </button>
        ) : (
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
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full',
              recording
                ? 'bg-[#0095F6] text-white'
                : 'text-foreground-muted hover:bg-surface-muted',
            )}
          >
            <Mic className="size-5" aria-hidden />
          </button>
        )}
      </div>
    </form>
  );
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
