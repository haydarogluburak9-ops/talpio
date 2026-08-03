import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { DashboardCards } from '@/features/admin/dashboard-cards';
import { SystemStatusCard } from '@/features/system-status/system-status-card';

export const metadata: Metadata = { title: 'Panel' };

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Panel" description="UstaPilot platform genel görünümü" />

      <main className="flex-1 space-y-6 p-6">
        <DashboardCards />
        <SystemStatusCard />
      </main>
    </>
  );
}
