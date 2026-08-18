import { buttonVariants } from '@talpio/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

import { OrderDetail } from '@/features/orders/order-detail';
import { t } from '@/lib/i18n';

export const metadata: Metadata = {
  title: t('order.detailTitle'),
  robots: { index: false, follow: false },
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/siparislerim"
        className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mb-4`}
      >
        ← {t('order.listTitle')}
      </Link>

      <OrderDetail orderId={id} />
    </div>
  );
}
