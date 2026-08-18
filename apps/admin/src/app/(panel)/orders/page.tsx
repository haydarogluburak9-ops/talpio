import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { OrdersPanel } from '@/features/admin/orders-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.orders') };

export default function OrdersPage() {
  return (
    <>
      <Topbar titleKey="admin.orders" descriptionKey="admin.ordersHint" />

      <main className="flex-1 space-y-6 p-6">
        <OrdersPanel />
      </main>
    </>
  );
}
