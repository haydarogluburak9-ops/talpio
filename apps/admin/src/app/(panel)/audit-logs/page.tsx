import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { AuditLogsPanel } from '@/features/admin/audit-logs-panel';

export const metadata: Metadata = { title: 'Denetim kayıtları' };

export default function AuditLogsPage() {
  return (
    <>
      <Topbar
        title="Denetim kayıtları"
        description="Yönetim panelinde yapılan tüm değişikliklerin izi."
      />

      <main className="flex-1 space-y-6 p-6">
        <AuditLogsPanel />
      </main>
    </>
  );
}
