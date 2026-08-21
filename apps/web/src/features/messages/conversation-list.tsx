'use client';

import { formatRelativeTime } from '@talpio/localization';
import type { Conversation } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { localeTag, t, getLocale } from '@/lib/i18n';

import { formatMessagePreview } from './message-ui';
import { useConversations } from './use-messages';

export function ConversationList({
  currentUserId,
  compact,
}: {
  currentUserId: string;
  /** Inbox sidebar: no outer card, divider rows only. */
  compact?: boolean;
}) {
  const conversations = useConversations();
  const pathname = usePathname();

  if (conversations.isPending) return <ListSkeleton rows={3} />;

  if (conversations.isError) {
    return (
      <div className={compact ? 'p-4' : 'social-panel p-4'}>
        <ErrorState
          title={t('status.errorTitle')}
          description={t('messaging.loadFailed')}
          action={{ label: t('common.retry'), onClick: () => void conversations.refetch() }}
        />
      </div>
    );
  }

  if (conversations.data.items.length === 0) {
    return (
      <div className={compact ? 'px-6 py-10' : 'social-panel px-6 py-10'}>
        <EmptyState title={t('messaging.empty')} description={t('messaging.emptyDescription')} />
      </div>
    );
  }

  return (
    <ul
      className={cn(
        'overflow-hidden',
        compact ? 'divide-y divide-border/60' : 'social-panel divide-y divide-border/70',
      )}
    >
      {conversations.data.items.map((conversation) => (
        <li key={conversation.id}>
          <ConversationRow
            conversation={conversation}
            currentUserId={currentUserId}
            active={pathname === `/mesajlar/${conversation.id}`}
          />
        </li>
      ))}
    </ul>
  );
}

function ConversationRow({
  conversation,
  currentUserId,
  active,
}: {
  conversation: Conversation;
  currentUserId: string;
  active: boolean;
}) {
  const locale = getLocale();
  const other = conversation.participants.find((item) => item.userId !== currentUserId);
  const preview = conversation.lastMessage;
  const hasUnread = conversation.unreadCount > 0;
  const title = conversation.isGroup
    ? conversation.title || t('messaging.newGroup')
    : (other?.displayName ?? t('messaging.chatTitle'));

  return (
    <Link
      href={`/mesajlar/${conversation.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/60',
        active && 'bg-surface-muted/80',
      )}
    >
      <div className="relative shrink-0">
        <Avatar name={title} url={other?.avatarUrl ?? null} />
        {hasUnread ? (
          <span
            className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-[#0095F6]"
            aria-hidden
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'truncate text-[15px] text-foreground',
              hasUnread ? 'font-semibold' : 'font-normal',
            )}
          >
            {title}
          </p>
          {preview ? (
            <span
              className={cn(
                'shrink-0 text-xs',
                hasUnread ? 'font-medium text-[#0095F6]' : 'text-foreground-muted',
              )}
            >
              {formatRelativeTime(preview.createdAt, locale)}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            'truncate text-sm',
            hasUnread ? 'font-medium text-foreground' : 'text-foreground-muted',
          )}
        >
          {formatMessagePreview(preview, currentUserId, t)}
        </p>
      </div>
    </Link>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="size-14 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span
      aria-hidden
      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-lg font-semibold text-white"
    >
      {name.slice(0, 1).toLocaleUpperCase(localeTag())}
    </span>
  );
}
