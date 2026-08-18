'use client';

import { LoadingState } from '@talpio/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { OrderList } from './order-list';

export function OrdersPageBody() {
  const session = useSession();
  const router = useRouter();
  const user = session.data ?? null;

  useEffect(() => {
    if (session.isSuccess && user === null) router.replace('/giris');
  }, [session.isSuccess, user, router]);

  if (session.isPending || user === null) return <LoadingState label="Siparişler yükleniyor" />;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t('order.listTitle')}</h1>
      <OrderList />
    </>
  );
}
