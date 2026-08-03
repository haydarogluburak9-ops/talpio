'use client';

import { UserRole } from '@ustapilot/types';
import { buttonVariants, cn } from '@ustapilot/ui';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';

/**
 * Başlıktaki hesap alanı. Oturum sunucudan doğrulandığı için ilk render'da
 * durum bilinmez; yanıt gelene kadar aynı yükseklikte bir yer tutucu gösterilir
 * ve düzen kaymaz.
 */
export function HeaderAccount({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const session = useSession();

  if (session.isPending) {
    return <div aria-hidden className="h-9 w-32 animate-pulse rounded-[--radius-control] bg-surface-muted" />;
  }

  const user = session.data ?? null;
  const isMobile = variant === 'mobile';
  const linkBase = isMobile ? 'w-full text-center' : '';

  if (user) {
    const href = user.role === UserRole.PROVIDER ? '/usta/panel' : '/hesabim';
    const label = user.role === UserRole.PROVIDER ? 'Usta paneli' : 'Hesabım';

    return (
      <Link href={href} className={cn(buttonVariants({ size: 'sm' }), linkBase)}>
        {label}
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
