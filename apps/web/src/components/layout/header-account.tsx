'use client';

import { buttonVariants, cn } from '@talpio/ui';
import { LogOut, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useLogout, useSession } from '@/features/auth/use-session';
import { useSocialMe } from '@/features/social/use-social';
import { localeTag, t } from '@/lib/i18n';

/**
 * Başlıktaki hesap alanı. Oturum sunucudan doğrulandığı için ilk render'da
 * durum bilinmez; yanıt gelene kadar aynı yükseklikte bir yer tutucu gösterilir
 * ve düzen kaymaz.
 */
export function HeaderAccount({
  variant = 'desktop',
}: {
  variant?: 'desktop' | 'mobile' | 'avatar';
}) {
  const session = useSession();
  const me = useSocialMe(Boolean(session.data) && variant === 'avatar');

  if (session.isPending) {
    return (
      <div
        aria-hidden
        className={
          variant === 'avatar'
            ? 'flex h-10 items-center gap-2'
            : 'h-9 w-32 animate-pulse rounded-[--radius-control] bg-surface-muted'
        }
      >
        {variant === 'avatar' ? (
          <>
            <span className="size-9 animate-pulse rounded-full bg-surface-muted" />
            <span className="hidden h-4 w-20 animate-pulse rounded bg-surface-muted sm:block" />
          </>
        ) : null}
      </div>
    );
  }

  const user = session.data ?? null;
  const isMobile = variant === 'mobile';
  const linkBase = isMobile ? 'w-full text-center' : '';

  if (user && variant === 'avatar') {
    return (
      <HeaderAccountMenu
        profileHref={me.data?.username ? `/u/${me.data.username}` : '/hesabim'}
        name={me.data?.displayName?.trim() || user.fullName?.trim() || user.email}
        avatarUrl={me.data?.avatarUrl ?? user.avatarUrl ?? null}
      />
    );
  }

  if (user) {
    const href = '/akis';
    const label = t('nav.feed');

    return (
      <Link
        href={href}
        className={cn(
          buttonVariants({ size: 'sm' }),
          'bg-brand-900 font-semibold tracking-wide text-white hover:bg-brand-800',
          linkBase,
        )}
      >
        {label}
      </Link>
    );
  }

  if (variant === 'avatar') {
    return (
      <Link
        href="/giris"
        className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white py-1.5 pr-3 pl-1.5 text-sm font-semibold text-brand-900 transition-colors hover:border-accent-500/40 hover:bg-surface-muted"
      >
        <span className="grid size-8 place-items-center rounded-full bg-surface-muted text-foreground-muted">
          <UserRound className="size-4" />
        </span>
        {t('nav.login')}
      </Link>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', isMobile && 'flex-col')}>
      <Link
        href="/giris"
        className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), linkBase)}
      >
        {t('nav.login')}
      </Link>
      <Link href="/kayit" className={cn(buttonVariants({ size: 'sm' }), linkBase)}>
        {t('nav.register')}
      </Link>
    </div>
  );
}

function HeaderAccountMenu({
  profileHref,
  name,
  avatarUrl,
}: {
  profileHref: string;
  name: string;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const avatar = (
    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-900 text-xs font-semibold text-accent-400">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        <span>
          {name.slice(0, 1).toLocaleUpperCase(localeTag()) || <UserRound className="size-3.5" />}
        </span>
      )}
    </span>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex max-w-[12rem] items-center gap-2 rounded-full border border-border/80 bg-white py-1 pr-3 pl-1 transition-colors hover:border-accent-500/40 hover:bg-surface-muted"
        aria-label={name}
        title={name}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {avatar}
        <span className="truncate text-sm font-semibold text-brand-900">{name}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[11.5rem] overflow-hidden rounded-xl border border-border bg-white py-1 shadow-soft dark:bg-[#0D1B2A]"
        >
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            <UserRound className="size-4 text-teal-600" aria-hidden />
            {t('nav.profile')}
          </Link>
          <Link
            href="/hesabim"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            <Settings className="size-4 text-foreground-muted" aria-hidden />
            {t('nav.settings')}
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            onClick={() => {
              setOpen(false);
              logout.mutate();
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
          >
            <LogOut className="size-4" aria-hidden />
            {t('nav.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
