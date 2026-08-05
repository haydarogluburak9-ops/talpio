'use client';

import { SUPPORT_TICKET_STATUS_TONES } from '@ustapilot/config';
import { formatDateTime, supportTicketStatusLabel } from '@ustapilot/localization';
import { SupportTicketStatus, type SupportMessage } from '@ustapilot/types';
import {
  Button,
  ErrorState,
  ListSkeleton,
  LoadingState,
  StatusPill,
  Textarea,
} from '@ustapilot/ui';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useCloseSupportTicket, useReplySupportTicket, useSupportTicket } from './use-support';

export function TicketDetailBody({ ticketId }: { ticketId: string }) {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  if (!user) return <LoadingState label={t('common.loading')} />;

  return <TicketDetail ticketId={ticketId} currentUserId={user.id} />;
}

function TicketDetail({ ticketId, currentUserId }: { ticketId: string; currentUserId: string }) {
  const locale = publicEnv.defaultLocale;
  const ticket = useSupportTicket(ticketId);
  const reply = useReplySupportTicket(ticketId);
  const close = useCloseSupportTicket(ticketId);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (ticket.isPending) return <ListSkeleton rows={4} />;

  if (ticket.isError || !ticket.data) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description={t('support.loadFailed')}
        action={{ label: t('common.retry'), onClick: () => void ticket.refetch() }}
      />
    );
  }

  const data = ticket.data;
  const isClosed =
    data.status === SupportTicketStatus.CLOSED || data.status === SupportTicketStatus.RESOLVED;

  async function onReply(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) return;

    try {
      await reply.mutateAsync({ body: trimmed, attachmentFileIds: [] });
      setBody('');
    } catch {
      setError(t('support.replyFailed'));
    }
  }

  async function onClose() {
    if (!window.confirm(t('support.closeConfirm'))) return;
    try {
      await close.mutateAsync();
    } catch {
      setError(t('support.closeFailed'));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{data.subject}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {formatDateTime(data.createdAt, locale)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            label={supportTicketStatusLabel(data.status, locale)}
            tone={SUPPORT_TICKET_STATUS_TONES[data.status]}
          />
          {!isClosed ? (
            <Button variant="outline" size="sm" onClick={() => void onClose()} disabled={close.isPending}>
              {t('support.close')}
            </Button>
          ) : null}
        </div>
      </header>

      <div className="flex h-[calc(100dvh-16rem)] min-h-[24rem] flex-col rounded-[--radius-card] border border-border bg-surface">
        <MessageList messages={data.messages} currentUserId={currentUserId} />

        {isClosed ? (
          <p className="border-t border-border px-4 py-4 text-sm text-foreground-muted">
            {t('support.closed')}
          </p>
        ) : (
          <form
            className="flex flex-col gap-2 border-t border-border p-4"
            onSubmit={(event) => void onReply(event)}
          >
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={t('support.replyPlaceholder')}
              rows={3}
              maxLength={4000}
            />
            {error ? <p className="text-sm text-danger-600">{error}</p> : null}
            <Button type="submit" disabled={reply.isPending || body.trim().length === 0}>
              {t('support.reply')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function MessageList({
  messages,
  currentUserId,
}: {
  messages: SupportMessage[];
  currentUserId: string;
}) {
  const locale = publicEnv.defaultLocale;
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [lastId]);

  return (
    <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {messages.map((message) => {
        const mine = message.senderId === currentUserId && !message.isFromStaff;
        return (
          <li
            key={message.id}
            className={mine ? 'ml-8 self-end' : 'mr-8 self-start'}
          >
            <div
              className={
                mine
                  ? 'rounded-[--radius-card] bg-brand-600 px-3 py-2 text-sm text-white'
                  : 'rounded-[--radius-card] bg-surface-muted px-3 py-2 text-sm text-foreground'
              }
            >
              <p className="mb-1 text-xs opacity-80">
                {message.isFromStaff ? t('support.staffLabel') : t('support.youLabel')}
              </p>
              <p className="whitespace-pre-wrap">{message.body}</p>
              <p className="mt-1 text-xs opacity-70">{formatDateTime(message.createdAt, locale)}</p>
            </div>
          </li>
        );
      })}
      <div ref={bottomRef} />
    </ol>
  );
}
