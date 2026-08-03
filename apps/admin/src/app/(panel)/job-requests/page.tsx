import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { JobsPanel } from '@/features/admin/jobs-panel';

export const metadata: Metadata = { title: 'İş talepleri' };

export default function JobRequestsPage() {
  return (
    <>
      <Topbar
        title="İş talepleri"
        description="Müşteri taleplerini durum, kategori ve konuma göre izleyin."
      />

      <main className="flex-1 space-y-6 p-6">
        <JobsPanel />
      </main>
    </>
  );
}
