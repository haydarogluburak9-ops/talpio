'use client';

import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  ListSkeleton,
  LoadingState,
} from '@ustapilot/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { JobCard } from '@/features/jobs/job-card';
import { useMyJobs } from '@/features/jobs/use-jobs';
import { OrderCard } from '@/features/orders/order-card';
import { useMyOrders } from '@/features/orders/use-orders';
import { t } from '@/lib/i18n';

import { useLogout, useSession } from './use-session';

/**
 * Hesap özeti. Sunucu bileşeni olarak yazılamaz: oturum bilgisi yalnızca
 * tarayıcıdaki HTTP-only çerezle yapılan `/auth/me` çağrısından gelir.
 */
export function AccountOverview() {
  const session = useSession();
  const logout = useLogout();
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
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="truncate">{user.fullName}</CardTitle>
            <p className="truncate text-sm text-foreground-muted">{user.email}</p>
          </div>
          <Badge tone="brand">{user.role}</Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/talep-olustur" className={buttonVariants()}>
            Talep oluştur
          </Link>
          <Link href="/kategoriler" className={buttonVariants({ variant: 'outline' })}>
            Kategorilere göz at
          </Link>
          <Link href="/mesajlar" className={buttonVariants({ variant: 'outline' })}>
            {t('messaging.listTitle')}
          </Link>
          <Link href="/profil" className={buttonVariants({ variant: 'outline' })}>
            {t('profile.title')}
          </Link>
          <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>Taleplerim</CardTitle>
          <Link
            href="/taleplerim"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            Tümünü gör
          </Link>
        </CardHeader>
        <CardContent>
          <RecentJobs />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle>{t('order.listTitle')}</CardTitle>
          <Link href="/siparislerim" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Tümünü gör
          </Link>
        </CardHeader>
        <CardContent>
          <RecentOrders />
        </CardContent>
      </Card>
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
        Henüz bir hizmet talebi oluşturmadınız. İlk talebinizi oluşturarak bölgenizdeki ustalardan
        teklif alabilirsiniz.
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
