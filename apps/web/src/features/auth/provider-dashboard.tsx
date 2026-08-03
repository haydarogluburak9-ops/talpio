'use client';

import { formatMoney } from '@ustapilot/localization';
import { OfferStatus, OrderStatus, UserRole } from '@ustapilot/types';
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ListSkeleton,
  LoadingState,
} from '@ustapilot/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useMyOffers } from '@/features/offers/use-offers';
import { OrderCard } from '@/features/orders/order-card';
import { useMyOrders } from '@/features/orders/use-orders';
import { useProviderWallet } from '@/features/payments/use-payments';
import { ProviderWallet } from '@/features/payments/provider-wallet';
import { ReceivedReviews } from '@/features/reviews/received-reviews';
import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

import { useLogout, useSession } from './use-session';

/** Ustanın "devam eden iş" saydığı sipariş durumları. */
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate">{user.fullName}</CardTitle>
            <p className="truncate text-sm text-foreground-muted">{t('provider.dashboardTitle')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/mesajlar" className={buttonVariants({ variant: 'outline' })}>
              {t('messaging.listTitle')}
            </Link>
            <Link href="/profil" className={buttonVariants({ variant: 'outline' })}>
              {t('profile.title')}
            </Link>
            <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
              {t('nav.logout')}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Metrics />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>{t('provider.activeJobsTitle')}</CardTitle>
          <Link href="/siparislerim" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Tümünü gör
          </Link>
        </CardHeader>
        <CardContent>
          <ActiveOrders />
        </CardContent>
      </Card>

      <ProviderWallet />

      <ReceivedReviews />
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      />
    </div>
  );
}

function Metric({
  label,
  value,
  isPending,
}: {
  label: string;
  value: string | null;
  isPending: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        {/* Veri gelmediyse sayı uydurulmaz; tire gösterilir. */}
        <p className="text-2xl font-semibold text-foreground">
          {isPending ? '…' : (value ?? '—')}
        </p>
        <p className="text-sm text-foreground-muted">{label}</p>
      </CardContent>
    </Card>
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
  const shouldRedirect = session.isSuccess && user?.role !== UserRole.PROVIDER && logout.isIdle;

  useEffect(() => {
    if (!shouldRedirect) return;
    router.replace(user === null ? '/giris' : '/hesabim');
  }, [shouldRedirect, user, router]);

  return { user, logout, isBlocked: session.isPending || shouldRedirect };
}
