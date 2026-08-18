import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { JobsPanel } from '@/features/admin/jobs-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.jobRequests') };

export default function JobRequestsPage() {
  return (
    <>
      <Topbar titleKey="admin.jobRequests" descriptionKey="admin.jobRequestsHint" />

      <main className="flex-1 space-y-6 p-6">
        <JobsPanel />
      </main>
    </>
  );
}
