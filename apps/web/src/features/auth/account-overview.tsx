'use client';

import { isMarketplaceRole } from '@talpio/types';
import { Button, buttonVariants, ErrorState, ListSkeleton, LoadingState } from '@talpio/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { JobCard } from '@/features/jobs/job-card';
import { useMyJobs } from '@/features/jobs/use-jobs';
import { OrderCard } from '@/features/orders/order-card';
import { useMyOrders } from '@/features/orders/use-orders';
import { useMyCommerceRequests } from '@/features/requests/use-requests';
import { PaymentHistory } from '@/features/payments/payment-history';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { InterestsSettings } from './interests-settings';
import { useLogout, useDeleteAccount, useSession } from './use-session';

/**
 * Hesap özeti. Sunucu bileşeni olarak yazılamaz: oturum bilgisi yalnızca
 * tarayıcıdaki HTTP-only çerezle yapılan `/auth/me` çağrısından gelir.
 */
export function AccountOverview() {
  const session = useSession();
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

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-6">
      <section className="social-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
              {t('nav.profile')}
            </p>
            <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
              {user.fullName}
            </h1>
            <p className="mt-1 truncate text-sm text-foreground-muted">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/talep-olustur"
            className={`${buttonVariants({ size: 'sm' })} bg-accent-500 text-white hover:bg-accent-600`}
          >
            Talep oluştur
          </Link>
          <Link href="/kategoriler" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Kategorilere göz at
          </Link>
          <Link href="/mesajlar" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            {t('messaging.listTitle')}
          </Link>
          <Link href="/destek" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            {t('nav.support')}
          </Link>
          <Link href="/sikayet" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            {t('complaint.createTitle')}
          </Link>
          <Link href="/profil" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            {t('profile.title')}
          </Link>
          {isMarketplaceRole(user.role) ? (
            <Link
              href="/satici/panel"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('nav.myBusiness')}
            </Link>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-danger-600"
            onClick={() => {
              if (window.confirm(t('settings.deleteAccountConfirm'))) {
                deleteAccount.mutate();
              }
            }}
            disabled={deleteAccount.isPending}
          >
            {deleteAccount.isPending
              ? t('settings.deleteAccountPending')
              : t('settings.deleteAccount')}
          </Button>
        </div>
      </section>

      <InterestsSettings />

      <section className="social-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            Taleplerim
          </h2>
          <Link href="/taleplerim" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
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
          <Link href="/tedariklerim" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
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
          <Link href="/siparislerim" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Tümünü gör
          </Link>
        </div>
        <RecentOrders />
      </section>

      {publicEnv.featurePayments ? (
        <>
          <PaymentHistory />
          <Link href="/odemeler" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            {t('payments.pageTitle')}
          </Link>
        </>
      ) : (
        <p className="text-sm text-foreground-muted">{t('payments.featureOff')}</p>
      )}
    </div>
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
