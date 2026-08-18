import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { AuditLogsPanel } from '@/features/admin/audit-logs-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.audit') };

export default function AuditLogsPage() {
  return (
    <>
      <Topbar titleKey="admin.audit" descriptionKey="admin.auditHint" />

      <main className="flex-1 space-y-6 p-6">
        <AuditLogsPanel />
      </main>
    </>
  );
}
