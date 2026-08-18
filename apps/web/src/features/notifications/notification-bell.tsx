'use client';

import { Bell } from 'lucide-react';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useUnreadCount } from './use-notifications';

/** Başlıktaki zil — profil fotoğrafının hemen solunda. */
export function NotificationBell() {
  const session = useSession();
  const loggedIn = Boolean(session.data);
  const unread = useUnreadCount();
  const count = loggedIn ? (unread.data ?? 0) : 0;

  return (
    <Link
      href={loggedIn ? '/bildirimler' : '/giris'}
      className="relative grid size-10 place-items-center rounded-xl border border-border/80 bg-white text-foreground-muted transition-colors hover:border-accent-500/40 hover:bg-surface-muted hover:text-foreground"
      aria-label={
        count > 0
          ? t('notifications.unreadCount', { count })
          : t('notifications.title')
      }
      title={t('notifications.title')}
    >
      <Bell className="size-5" />
      {count > 0 ? (
        <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold leading-4 text-white">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
