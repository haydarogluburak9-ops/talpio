import type { Metadata } from 'next';

import { OrdersPageBody } from '@/features/orders/orders-page-body';
import { t } from '@/lib/i18n';
import { applyRequestLocale, generatePageMetadata } from '@/lib/server-locale';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('order.listTitle', { robots: { index: false, follow: false } });
}

export default async function MyOrdersPage() {
  await applyRequestLocale();
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <OrdersPageBody />
    </div>
  );
}
