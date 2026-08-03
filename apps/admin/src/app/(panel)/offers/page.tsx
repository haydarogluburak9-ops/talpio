import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { OffersPanel } from '@/features/admin/offers-panel';

export const metadata: Metadata = { title: 'Teklifler' };

export default function OffersPage() {
  return (
    <>
      <Topbar title="Teklifler" description="Ustaların taleplere verdiği teklifleri izleyin." />

      <main className="flex-1 space-y-6 p-6">
        <OffersPanel />
      </main>
    </>
  );
}
