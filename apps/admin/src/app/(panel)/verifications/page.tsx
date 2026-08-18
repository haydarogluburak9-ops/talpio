import { VerificationStatus } from '@talpio/types';
import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { ProvidersPanel } from '@/features/admin/providers-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.verifications') };

export default function VerificationsPage() {
  return (
    <>
      <Topbar titleKey="admin.verifications" descriptionKey="admin.verificationsHint" />

      <main className="flex-1 space-y-6 p-6">
        <ProvidersPanel
          title="İnceleme bekleyenler"
          description="Verilen karar satıcının bekleyen belgelerine de uygulanır ve denetim kaydına yazılır."
          lockedStatus={VerificationStatus.PENDING}
        />
      </main>
    </>
  );
}
