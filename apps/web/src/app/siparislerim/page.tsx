import type { Metadata } from 'next';

import { OrdersPageBody } from '@/features/orders/orders-page-body';

export const metadata: Metadata = {
  title: 'Siparişlerim',
  robots: { index: false, follow: false },
};

export default function MyOrdersPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <OrdersPageBody />
    </div>
  );
}
