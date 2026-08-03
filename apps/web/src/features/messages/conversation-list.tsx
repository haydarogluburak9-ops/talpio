'use client';

import { formatRelativeTime } from '@ustapilot/localization';
import type { Conversation } from '@ustapilot/types';
import { Card, CardContent, EmptyState, ErrorState, ListSkeleton } from '@ustapilot/ui';
import Link from 'next/link';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useConversations } from './use-messages';

export function ConversationList({ currentUserId }: { currentUserId: string }) {
  const conversations = useConversations();

  if (conversations.isPending) return <ListSkeleton rows={3} />;

  if (conversations.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description={t('messaging.loadFailed')}
        action={{ label: t('common.retry'), onClick: () => void conversations.refetch() }}
      />
    );
  }

  if (conversations.data.items.length === 0) {
    return (
      <EmptyState title={t('messaging.empty')} description={t('messaging.emptyDescription')} />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {conversations.data.items.map((conversation) => (
        <li key={conversation.id}>
          <ConversationRow conversation={conversation} currentUserId={currentUserId} />
        </li>
      ))}
    </ul>
  );
}

function ConversationRow({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const locale = publicEnv.defaultLocale;
  const other = conversation.participants.find((item) => item.userId !== currentUserId);
  const preview = conversation.lastMessage;
  const hasUnread = conversation.unreadCount > 0;

  return (
    <Link href={`/mesajlar/${conversation.id}`} className="block rounded-[--radius-card]">
      <Card className="transition-colors hover:bg-surface-muted">
        <CardContent className="flex items-center gap-3 pt-5 sm:pt-6">
          <Avatar name={other?.displayName ?? '?'} url={other?.avatarUrl ?? null} />

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate font-medium text-foreground">
                {other?.displayName ?? t('messaging.chatTitle')}
              </p>
              {preview ? (
                <span className="shrink-0 text-xs text-foreground-muted">
                  {formatRelativeTime(preview.createdAt, locale)}
                </span>
              ) : null}
            </div>
            <p
              className={
                hasUnread
                  ? 'truncate text-sm font-medium text-foreground'
                  : 'truncate text-sm text-foreground-muted'
              }
            >
              {preview?.body ?? t('messaging.threadEmpty')}
            </p>
          </div>

          {hasUnread ? (
            <span
              className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white"
              aria-label={`${conversation.unreadCount} ${t('messaging.unreadCount')}`}
            >
              {conversation.unreadCount}
            </span>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

/** Görsel yoksa baş harfe düşülür; boş kare yerine tanınır bir işaret kalır. */
function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // Profil görselleri harici depodan gelir; Next optimizasyonu için ayrı yapılandırma
    // gerektirdiğinden düz `img` kullanılır.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-11 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700"
    >
      {name.slice(0, 1).toLocaleUpperCase('tr-TR')}
    </span>
  );
}
