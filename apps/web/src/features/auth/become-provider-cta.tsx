'use client';

import { buttonVariants, cn } from '@talpio/ui';
import Link from 'next/link';

import { t } from '@/lib/i18n';

import { useSession } from './use-session';

type Tone = 'onDark' | 'onLight';

/** Oturum durumuna göre kayıt / iş paneli düğmelerini gösterir. */
export function BecomeProviderCta({ tone = 'onDark' }: { tone?: Tone }) {
  const session = useSession();
  const user = session.data;
  const onDark = tone === 'onDark';

  const primary = cn(
    buttonVariants({ size: 'lg' }),
    'bg-accent-500 px-7 font-semibold tracking-wide text-white hover:bg-accent-600',
  );
  const secondary = onDark
    ? cn(
        buttonVariants({ variant: 'outline', size: 'lg' }),
        'border-white/30 bg-white/[0.06] px-7 font-medium tracking-wide text-white backdrop-blur-sm hover:bg-white/12 hover:text-white',
      )
    : cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-7 font-medium tracking-wide');
  const hint = onDark ? 'text-brand-100/85' : 'text-foreground-muted';

  if (session.isPending) {
    return (
      <div
        className={cn(
          'h-12 w-full max-w-xs animate-pulse rounded-[--radius-control]',
          onDark ? 'bg-white/10' : 'bg-border',
        )}
      />
    );
  }

  if (user) {
    return (
      <div className="flex flex-col gap-3">
        <p className={cn('max-w-md text-sm', hint)}>{t('auth.dualRoleHint')}</p>
        <Link href="/satici/panel" className={cn(primary, 'w-fit')}>
          {t('becomeProvider.goToPanel')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link href="/kayit" className={primary}>
        {t('auth.createAccount')}
      </Link>
      <Link href="/giris" className={secondary}>
        {t('auth.signIn')}
      </Link>
    </div>
  );
}
