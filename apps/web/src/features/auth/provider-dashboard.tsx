'use client';

import { formatMoney } from '@talpio/localization';
import { isMarketplaceRole, OfferStatus, OrderStatus } from '@talpio/types';
import {
  Button,
  buttonVariants,
  ListSkeleton,
  LoadingState,
  cn,
} from '@talpio/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AgentPanel } from '@/features/agent/agent-panel';
import { PremiumPlansPanel } from '@/features/billing/premium-plans-panel';
import { SellerOpsPanels } from '@/features/businesses/seller-ops-panels';
import { useMyOffers } from '@/features/offers/use-offers';
import { OrderCard } from '@/features/orders/order-card';
import { useMyOrders } from '@/features/orders/use-orders';
import { useProviderWallet } from '@/features/payments/use-payments';
import { ProviderWallet } from '@/features/payments/provider-wallet';
import { ReceivedReviews } from '@/features/reviews/received-reviews';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useLogout, useSession } from './use-session';

/** Satıcının "devam eden iş" saydığı sipariş durumları. */
const ACTIVE_ORDER_STATUSES = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.IN_PROGRESS,
  OrderStatus.AWAITING_APPROVAL,
];

export function ProviderDashboard() {
  const session = useSessionForProvider();
  const { user, isBlocked, logout } = session;

  if (isBlocked || !user) return <LoadingState label="Panel yükleniyor" />;

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-6">
      <section className="social-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-xs font-semibold tracking-[0.18em] text-accent-600 uppercase">
              {t('nav.myBusiness')}
            </p>
            <h1 className="mt-1 truncate font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
              {user.fullName}
            </h1>
            <p className="mt-1 truncate text-sm text-foreground-muted">{t('provider.dashboardTitle')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/akis"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
            >
              {t('social.goToFeed')}
            </Link>
            <Link
              href="/satici/tedarik"
              className={cn(buttonVariants({ size: 'sm' }), 'bg-accent-500 text-white hover:bg-accent-600')}
            >
              Tedarik talepleri
            </Link>
            <Link href="/mesajlar" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t('messaging.listTitle')}
            </Link>
            <Link href="/profil" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t('profile.title')}
            </Link>
            <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      </section>

      <Metrics />

      <section id="isler" className="social-panel scroll-mt-28 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            {t('provider.activeJobsTitle')}
          </h2>
          <Link href="/siparislerim" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Tümünü gör
          </Link>
        </div>
        <ActiveOrders />
      </section>

      <section id="raporlar" className="scroll-mt-28">
        <ProviderWallet />
      </section>

      <section id="crm" className="scroll-mt-28">
        <SellerOpsPanels />
      </section>

      <ReceivedReviews />

      {publicEnv.featurePremium ? (
        <section className="scroll-mt-28">
          <PremiumPlansPanel />
        </section>
      ) : (
        <p className="text-sm text-foreground-muted">{t('billing.featureOff')}</p>
      )}

      {publicEnv.featureAgent ? (
        <section id="ai" className="scroll-mt-28">
          <AgentPanel />
        </section>
      ) : (
        <p className="text-sm text-foreground-muted">{t('agent.featureOff')}</p>
      )}
    </div>
  );
}

/** Panel ölçümleri gerçek uçlardan gelir; bloke hakediş cüzdan özetinden okunur. */
function Metrics() {
  const locale = publicEnv.defaultLocale;
  const activeOrders = useMyOrders({ status: ACTIVE_ORDER_STATUSES, limit: 1 });
  const pendingOffers = useMyOffers({ status: [OfferStatus.SUBMITTED], limit: 1 });
  const completedOrders = useMyOrders({ status: [OrderStatus.COMPLETED], limit: 100 });
  const wallet = useProviderWallet();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric
        label={t('provider.activeJobsTitle')}
        value={activeOrders.data ? String(activeOrders.data.meta.total) : null}
        isPending={activeOrders.isPending}
      />
      <Metric
        label="Bekleyen teklif"
        value={pendingOffers.data ? String(pendingOffers.data.meta.total) : null}
        isPending={pendingOffers.isPending}
      />
      <Metric
        label={t('provider.completedJobs')}
        value={completedOrders.data ? String(completedOrders.data.meta.total) : null}
        isPending={completedOrders.isPending}
      />
      <Metric
        label={t('provider.pendingPayout')}
        value={wallet.data ? formatMoney(wallet.data.pending, locale) : null}
        isPending={wallet.isPending}
        accent
      />
    </div>
  );
}

function Metric({
  label,
  value,
  isPending,
  accent = false,
}: {
  label: string;
  value: string | null;
  isPending: boolean;
  accent?: boolean;
}) {
  return (
    <div className="social-panel p-4 sm:p-5">
      <p
        className={cn(
          'text-2xl font-semibold tracking-tight',
          accent ? 'text-accent-600' : 'text-brand-900 dark:text-foreground',
        )}
      >
        {isPending ? '…' : (value ?? '—')}
      </p>
      <p className="mt-1 text-sm text-foreground-muted">{label}</p>
    </div>
  );
}

function ActiveOrders() {
  const orders = useMyOrders({ status: ACTIVE_ORDER_STATUSES, limit: 5 });

  if (orders.isPending) return <ListSkeleton rows={2} />;

  if (orders.isError) {
    return (
      <p className="text-sm text-foreground-muted">
        İşleriniz şu anda yüklenemedi.{' '}
        <button type="button" onClick={() => void orders.refetch()} className="underline">
          {t('common.retry')}
        </button>
      </p>
    );
  }

  if (orders.data.items.length === 0) {
    return <p className="text-sm text-foreground-muted">{t('order.providerEmptyDescription')}</p>;
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

/**
 * Yetkisiz kullanıcı panelde bekletilmez: oturum yoksa girişe, müşteri ise
 * kendi hesap sayfasına gönderilir. Çıkış sırasında yönlendirmeyi çıkış işlemi
 * üstlenir, bu yüzden burada devreye girilmez.
 */
function useSessionForProvider() {
  const session = useSession();
  const logout = useLogout();
  const router = useRouter();

  const user = session.data ?? null;
  const marketplace = user != null && isMarketplaceRole(user.role);
  const shouldRedirect = session.isSuccess && !marketplace && logout.isIdle;

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace(user === null ? '/giris' : '/hesabim');
  }, [shouldRedirect, user, router]);

  return { user, logout, isBlocked: session.isPending || shouldRedirect };
}
