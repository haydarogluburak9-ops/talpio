'use client';

import { buttonVariants, cn } from '@talpio/ui';
import { UserRound } from 'lucide-react';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { useSocialMe } from '@/features/social/use-social';
import { localeTag } from '@/lib/i18n';

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
    const href = me.data?.username
      ? `/u/${me.data.username}`
      : '/hesabim';
    const name = me.data?.displayName?.trim() || user.fullName?.trim() || user.email;
    const avatarUrl = me.data?.avatarUrl ?? user.avatarUrl ?? null;

    return (
      <Link
        href={href}
        className="inline-flex max-w-[12rem] items-center gap-2 rounded-full border border-border/80 bg-white py-1 pr-3 pl-1 transition-colors hover:border-accent-500/40 hover:bg-surface-muted"
        aria-label={name}
        title={name}
      >
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
        <span className="truncate text-sm font-semibold text-brand-900">{name}</span>
      </Link>
    );
  }

  if (user) {
    const href = '/akis';
    const label = 'Akış';

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
        Giriş yap
      </Link>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', isMobile && 'flex-col')}>
      <Link
        href="/giris"
        className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }), linkBase)}
      >
        Giriş yap
      </Link>
      <Link href="/kayit" className={cn(buttonVariants({ size: 'sm' }), linkBase)}>
        Kaydol
      </Link>
    </div>
  );
}
