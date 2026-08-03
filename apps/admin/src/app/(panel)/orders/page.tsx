import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { OrdersPanel } from '@/features/admin/orders-panel';

export const metadata: Metadata = { title: 'Siparişler' };

export default function OrdersPage() {
  return (
    <>
      <Topbar
        title="Siparişler"
        description="Kabul edilen tekliflerden doğan siparişleri ve komisyonları izleyin."
      />

      <main className="flex-1 space-y-6 p-6">
        <OrdersPanel />
      </main>
    </>
  );
}
