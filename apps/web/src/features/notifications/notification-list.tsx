'use client';

import { formatRelativeTime, renderNotification } from '@talpio/localization';
import type { Notification } from '@talpio/types';
import {
  Button,
  EmptyState,
  ErrorState,
  ListSkeleton,
  cn,
} from '@talpio/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { t, getLocale } from '@/lib/i18n';

import { resolveWebDeepLink } from './resolve-deep-link';
import { useMarkAllRead, useMarkRead, useNotifications } from './use-notifications';

type Filter = 'all' | 'unread';

export function NotificationList() {
  const notifications = useNotifications({ limit: 50 });
  const markAllRead = useMarkAllRead();
  const [filter, setFilter] = useState<Filter>('all');

  // `?? []` her render'da yeni dizi üretip memo'yu boşa çıkarır.
  const rows = notifications.data?.items;
  const unreadCount = notifications.data?.meta.unreadCount ?? 0;
  const visible = useMemo(() => {
    const all = rows ?? [];
    return filter === 'unread' ? all.filter((item) => !item.readAt) : all;
  }, [rows, filter]);

  if (notifications.isPending) return <ListSkeleton rows={4} />;

  if (notifications.isError) {
    return (
      <div className="social-panel p-4">
        <ErrorState
          title={t('status.errorTitle')}
          description={t('notifications.loadFailed')}
          action={{ label: t('common.retry'), onClick: () => void notifications.refetch() }}
        />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="social-panel px-6 py-10">
        <EmptyState
          title={t('notifications.empty')}
          description={t('notifications.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-20 lg:pb-6">
      <div className="social-panel flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
        <div className="flex gap-1 rounded-xl bg-surface-muted/80 p-1">
          {(
            [
              ['all', t('notifications.filterAll')],
              ['unread', t('notifications.filterUnread')],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                filter === key
                  ? 'bg-brand-900 text-white'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {unreadCount > 0 ? (
          <div className="flex items-center gap-3">
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
      </div>

      {visible.length === 0 ? (
        <div className="social-panel px-6 py-10">
          <EmptyState title={t('notifications.emptyUnread')} />
        </div>
      ) : (
        <ul className="social-panel divide-y divide-border/70 overflow-hidden">
          {visible.map((notification) => (
            <li key={notification.id}>
              <NotificationRow notification={notification} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const router = useRouter();
  const markRead = useMarkRead();
  const locale = getLocale();
  const rendered = renderNotification(notification.type, notification.params, locale);
  const href = resolveWebDeepLink(notification.deepLink);
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
    <div
      className={cn(
        'flex flex-col gap-1 px-4 py-3.5 transition-colors hover:bg-surface-muted/70',
        unread && 'bg-accent-50/40 dark:bg-accent-900/10',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className={cn('truncate text-sm', unread ? 'font-semibold text-foreground' : 'font-medium')}>
          {rendered.title}
        </p>
        <span className="shrink-0 text-[11px] text-foreground-muted">
          {formatRelativeTime(notification.createdAt, locale)}
        </span>
      </div>
      <p className="text-sm text-foreground-muted">{rendered.body}</p>
    </div>
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
      className="block"
      onClick={(event) => {
        event.preventDefault();
        void open();
      }}
    >
      {body}
    </Link>
  );
}
