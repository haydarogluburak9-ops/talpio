'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useUnreadCount } from './use-notifications';

/** Başlıktaki zil; oturum yoksa gizlenir. */
export function NotificationBell() {
  const session = useSession();
  const unread = useUnreadCount();

  if (!session.data) return null;

  const count = unread.data ?? 0;

  return (
    <Link
      href="/bildirimler"
      className="relative grid size-10 place-items-center rounded-[--radius-control] text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      aria-label={
        count > 0
          ? t('notifications.unreadCount', { count })
          : t('notifications.title')
      }
    >
      <Bell className="size-5" />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold leading-4 text-brand-foreground">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
