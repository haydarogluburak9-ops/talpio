'use client';

import { formatRelativeTime } from '@talpio/localization';
import type { Conversation } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { localeTag, t, getLocale } from '@/lib/i18n';

import { useConversations } from './use-messages';

export function ConversationList({ currentUserId }: { currentUserId: string }) {
  const conversations = useConversations();
  const pathname = usePathname();

  if (conversations.isPending) return <ListSkeleton rows={3} />;

  if (conversations.isError) {
    return (
      <div className="social-panel p-4">
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
      <div className="social-panel px-6 py-10">
        <EmptyState title={t('messaging.empty')} description={t('messaging.emptyDescription')} />
      </div>
    );
  }

  return (
    <ul className="social-panel divide-y divide-border/70 overflow-hidden">
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

  return (
    <Link
      href={`/mesajlar/${conversation.id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted/80',
        active && 'bg-accent-50/70 dark:bg-accent-900/15',
      )}
    >
      <Avatar name={other?.displayName ?? '?'} url={other?.avatarUrl ?? null} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-semibold text-brand-900 dark:text-foreground">
            {conversation.isGroup
              ? conversation.title || t('messaging.newGroup')
              : (other?.displayName ?? t('messaging.chatTitle'))}
          </p>
          {preview ? (
            <span className="shrink-0 text-[11px] text-foreground-muted">
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
          {preview?.body ?? t('messaging.threadEmpty')}
        </p>
      </div>

      {hasUnread ? (
        <span
          className="shrink-0 rounded-full bg-accent-500 px-2 py-0.5 text-xs font-semibold text-white"
          aria-label={`${conversation.unreadCount} ${t('messaging.unreadCount')}`}
        >
          {conversation.unreadCount}
        </span>
      ) : null}
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
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-accent-400"
    >
      {name.slice(0, 1).toLocaleUpperCase(localeTag())}
    </span>
  );
}
