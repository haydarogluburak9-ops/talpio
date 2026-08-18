import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { DashboardCards } from '@/features/admin/dashboard-cards';
import { SystemStatusCard } from '@/features/system-status/system-status-card';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.dashboard') };

export default function DashboardPage() {
  return (
    <>
      <Topbar titleKey="admin.dashboard" descriptionKey="admin.dashboardHint" />

      <main className="flex-1 space-y-6 p-6">
        <DashboardCards />
        <SystemStatusCard />
      </main>
    </>
  );
}
