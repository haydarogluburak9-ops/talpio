'use client';

import { UserRole } from '@ustapilot/types';
import { LoadingState } from '@ustapilot/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { OrderList } from './order-list';

/**
 * Başlık ve liste ustaya göre değişir; bu yüzden sayfa gövdesi oturumu okuyan
 * bir istemci bileşenidir.
 */
export function OrdersPageBody() {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  if (session.isPending || user === null) return <LoadingState label="Siparişler yükleniyor" />;

  const isProvider = user.role === UserRole.PROVIDER;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t(isProvider ? 'order.providerListTitle' : 'order.listTitle')}
      </h1>
      <OrderList role={user.role} />
    </>
  );
}
