'use client';

import { formatRelativeTime, renderNotification } from '@ustapilot/localization';
import type { Notification, UserRole } from '@ustapilot/types';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  ListSkeleton,
  cn,
} from '@ustapilot/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSession } from '@/features/auth/use-session';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { resolveWebDeepLink } from './resolve-deep-link';
import { useMarkAllRead, useMarkRead, useNotifications } from './use-notifications';

export function NotificationList() {
  const session = useSession();
  const notifications = useNotifications({ limit: 50 });
  const markAllRead = useMarkAllRead();

  if (notifications.isPending) return <ListSkeleton rows={4} />;

  if (notifications.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description={t('notifications.loadFailed')}
        action={{ label: t('common.retry'), onClick: () => void notifications.refetch() }}
      />
    );
  }

  const items = notifications.data.items;
  const unreadCount = notifications.data.meta.unreadCount;

  if (items.length === 0) {
    return (
      <EmptyState title={t('notifications.empty')} description={t('notifications.emptyDescription')} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {unreadCount > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-muted">
            {t('notifications.unreadCount', { count: unreadCount })}
          </p>
          <Button
            size="sm"
            variant="ghost"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            {t('notifications.markAllRead')}
          </Button>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2">
        {items.map((notification) => (
          <li key={notification.id}>
            <NotificationRow
              notification={notification}
              role={session.data?.role}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({
  notification,
  role,
}: {
  notification: Notification;
  role: UserRole | null | undefined;
}) {
  const router = useRouter();
  const markRead = useMarkRead();
  const locale = publicEnv.defaultLocale;
  const rendered = renderNotification(notification.type, notification.params, locale);
  const href = resolveWebDeepLink(notification.deepLink, role);
  const unread = !notification.readAt;

  async function open() {
    if (unread) {
      try {
        await markRead.mutateAsync(notification.id);
      } catch {
        // Okundu damgası başarısız olsa bile hedefe gidilir.
      }
    }
    if (href) router.push(href);
  }

  const body = (
    <Card
      className={cn(
        'transition-colors hover:bg-surface-muted',
        unread && 'border-brand/40 bg-brand/5',
      )}
    >
      <CardContent className="flex flex-col gap-1 pt-5 sm:pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className={cn('truncate font-medium', unread ? 'text-foreground' : 'text-foreground')}>
            {rendered.title}
          </p>
          <span className="shrink-0 text-xs text-foreground-muted">
            {formatRelativeTime(notification.createdAt, locale)}
          </span>
        </div>
        <p className="text-sm text-foreground-muted">{rendered.body}</p>
      </CardContent>
    </Card>
  );

  if (!href) {
    return (
      <button type="button" className="block w-full text-left" onClick={() => void open()}>
        {body}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className="block rounded-[--radius-card]"
      onClick={(event) => {
        event.preventDefault();
        void open();
      }}
    >
      {body}
    </Link>
  );
}
