'use client';

import { isMarketplaceRole } from '@talpio/types';
import { cn, ErrorState, ListSkeleton, LoadingState } from '@talpio/ui';
import {
  ClipboardPlus,
  Compass,
  Flag,
  LifeBuoy,
  LogOut,
  MessageCircle,
  Store,
  Trash2,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { JobCard } from '@/features/jobs/job-card';
import { useMyJobs } from '@/features/jobs/use-jobs';
import { OrderCard } from '@/features/orders/order-card';
import { useMyOrders } from '@/features/orders/use-orders';
import { useMyCommerceRequests } from '@/features/requests/use-requests';
import { PaymentHistory } from '@/features/payments/payment-history';
import { useSocialMe } from '@/features/social/use-social';
import { publicEnv } from '@/lib/env';
import { localeTag, t } from '@/lib/i18n';

import { InterestsSettings } from './interests-settings';
import { useLogout, useDeleteAccount, useSession } from './use-session';

/**
 * Hesap özeti. Sunucu bileşeni olarak yazılamaz: oturum bilgisi yalnızca
 * tarayıcıdaki HTTP-only çerezle yapılan `/auth/me` çağrısından gelir.
 */
export function AccountOverview() {
  const session = useSession();
  const me = useSocialMe(Boolean(session.data));
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const router = useRouter();

  const user = session.data ?? null;

  // Oturumu olmayan ziyaretçi girişe gönderilir. Çıkış yapan kullanıcı ise
  // buradan yönlendirilmez: hedefi çıkış işlemi belirler, iki yönlendirme
  // yarışırsa kullanıcı ana sayfa yerine giriş formunda kalırdı.
  const shouldRedirect = session.isSuccess && user === null && logout.isIdle;

  useEffect(() => {
    if (shouldRedirect) router.replace('/giris');
  }, [shouldRedirect, router]);

  if (session.isError) {
    return (
      <ErrorState
        title="Hesap bilgileri alınamadı"
        description="Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin."
        action={{ label: 'Tekrar dene', onClick: () => void session.refetch() }}
      />
    );
  }

  if (!user) return <LoadingState label="Hesap bilgileri yükleniyor" />;

  const displayName = me.data?.displayName?.trim() || user.fullName?.trim() || user.email;
  const username = me.data?.username;
  const avatarUrl = me.data?.avatarUrl ?? user.avatarUrl ?? null;
  const profileHref = username ? `/u/${username}` : '/profil';

  const quickActions = [
    {
      key: 'request',
      href: '/talep-olustur',
      label: 'Talep oluştur',
      icon: ClipboardPlus,
      tone: 'bg-accent-500 text-white shadow-[0_6px_16px_rgb(255_106_0_/_0.35)]',
      featured: true,
    },
    {
      key: 'messages',
      href: '/mesajlar',
      label: t('messaging.listTitle'),
      icon: MessageCircle,
      tone: 'bg-violet-50 text-violet-600',
    },
    {
      key: 'profile',
      href: profileHref,
      label: t('profile.title'),
      icon: UserRound,
      tone: 'bg-teal-50 text-teal-600',
    },
    {
      key: 'categories',
      href: '/kategoriler',
      label: 'Keşfet',
      icon: Compass,
      tone: 'bg-sky-50 text-sky-600',
    },
    {
      key: 'support',
      href: '/destek',
      label: t('nav.support'),
      icon: LifeBuoy,
      tone: 'bg-brand-50 text-brand-700',
    },
    {
      key: 'complaint',
      href: '/sikayet',
      label: t('complaint.createTitle'),
      icon: Flag,
      tone: 'bg-amber-50 text-amber-700',
    },
    ...(isMarketplaceRole(user.role)
      ? [
          {
            key: 'business',
            href: '/satici/panel',
            label: t('nav.myBusiness'),
            icon: Store,
            tone: 'bg-emerald-50 text-emerald-700',
          },
        ]
      : []),
  ] as const;

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-6">
      <section className="social-panel overflow-hidden">
        <div
          className="relative h-28 bg-gradient-to-br from-brand-900 via-brand-700 to-accent-500 sm:h-32"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgb(255_255_255_/_0.18),transparent_45%)]" />
        </div>

        <div className="relative px-5 pb-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 items-end gap-4">
              <div className="-mt-10 shrink-0">
                <AccountAvatar name={displayName} url={avatarUrl} />
              </div>
              <div className="min-w-0 pb-1 pt-3">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-accent-600 uppercase">
                  {t('nav.settings')}
                </p>
                <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground sm:text-[1.65rem]">
                  {displayName}
                </h1>
                {username ? (
                  <p className="mt-0.5 truncate text-sm font-medium text-foreground-muted">
                    @{username}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.key}
                  href={action.href}
                  className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-2 transition-colors hover:bg-surface-muted/70"
                >
                  <span
                    className={cn(
                      'grid size-11 place-items-center rounded-2xl transition-transform group-hover:scale-[1.03]',
                      action.tone,
                      !('featured' in action && action.featured) && 'ring-1 ring-black/[0.04]',
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-foreground">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-surface-muted/35">
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-white text-foreground-muted shadow-sm">
                <LogOut className="size-4" aria-hidden />
              </span>
              {logout.isPending ? 'Çıkış yapılıyor…' : t('nav.logout')}
            </button>
            <div className="h-px bg-border/70" />
            <button
              type="button"
              disabled={deleteAccount.isPending}
              onClick={() => {
                if (window.confirm(t('settings.deleteAccountConfirm'))) {
                  deleteAccount.mutate();
                }
              }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-60"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-4" aria-hidden />
              </span>
              {deleteAccount.isPending
                ? t('settings.deleteAccountPending')
                : t('settings.deleteAccount')}
            </button>
          </div>
        </div>
      </section>

      <InterestsSettings />

      <section className="social-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            Taleplerim
          </h2>
          <Link href="/taleplerim" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Tümünü gör
          </Link>
        </div>
        <RecentJobs />
      </section>

      <section className="social-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            Ticaret taleplerim
          </h2>
          <Link href="/tedariklerim" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Tümünü gör
          </Link>
        </div>
        <RecentCommerceRequests />
      </section>

      <section className="social-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            {t('order.listTitle')}
          </h2>
          <Link href="/siparislerim" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Tümünü gör
          </Link>
        </div>
        <RecentOrders />
      </section>

      {publicEnv.featurePayments ? (
        <>
          <PaymentHistory />
          <Link href="/odemeler" className="inline-flex text-sm font-semibold text-accent-600 hover:text-accent-700">
            {t('payments.pageTitle')}
          </Link>
        </>
      ) : (
        <p className="text-sm text-foreground-muted">{t('payments.featureOff')}</p>
      )}
    </div>
  );
}

function AccountAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="size-20 rounded-2xl object-cover ring-4 ring-surface sm:size-[5.5rem]"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid size-20 place-items-center rounded-2xl bg-accent-500 font-display text-2xl font-bold text-white ring-4 ring-surface sm:size-[5.5rem]"
    >
      {name.slice(0, 1).toLocaleUpperCase(localeTag())}
    </span>
  );
}

/** Hesap özetinde yalnızca son birkaç talep gösterilir; tamamı ayrı sayfada. */
function RecentJobs() {
  const jobs = useMyJobs({ limit: 3 });

  if (jobs.isPending) return <ListSkeleton rows={2} />;

  if (jobs.isError) {
    return (
      <p className="text-sm text-foreground-muted">
        Talepleriniz şu anda yüklenemedi.{' '}
        <button type="button" onClick={() => void jobs.refetch()} className="underline">
          Tekrar dene
        </button>
      </p>
    );
  }

  if (jobs.data.items.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Henüz bir talep oluşturmadınız. İlk talebinizi oluşturarak satıcılardan teklif
        alabilirsiniz.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {jobs.data.items.map((job) => (
        <li key={job.id}>
          <JobCard job={job} />
        </li>
      ))}
    </ul>
  );
}

/** Devam eden işler hesap özetinde öne çıkar; tamamı ayrı sayfada listelenir. */
function RecentOrders() {
  const orders = useMyOrders({ limit: 3 });

  if (orders.isPending) return <ListSkeleton rows={2} />;

  if (orders.isError) {
    return (
      <p className="text-sm text-foreground-muted">
        Siparişleriniz şu anda yüklenemedi.{' '}
        <button type="button" onClick={() => void orders.refetch()} className="underline">
          Tekrar dene
        </button>
      </p>
    );
  }

  if (orders.data.items.length === 0) {
    return <p className="text-sm text-foreground-muted">{t('order.emptyDescription')}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {orders.data.items.map((order) => (
        <li key={order.id}>
          <OrderCard order={order} />
        </li>
      ))}
    </ul>
  );
}

function RecentCommerceRequests() {
  const requests = useMyCommerceRequests();
  const items = (requests.data?.items ?? []).slice(0, 3);

  if (requests.isPending) return <ListSkeleton rows={2} />;
  if (requests.isError) {
    return <p className="text-sm text-foreground-muted">Ticaret talepleri yüklenemedi.</p>;
  }
  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Henüz ticaret talebi yok.{' '}
        <Link href="/tedarik" className="underline">
          Talep oluştur
        </Link>
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((row) => (
        <li key={row.id}>
          <Link href={`/tedarik/${row.id}`} className="font-medium text-accent-600 hover:underline">
            {row.title}
          </Link>
          <span className="ml-2 text-foreground-muted">{row.status}</span>
        </li>
      ))}
    </ul>
  );
}
