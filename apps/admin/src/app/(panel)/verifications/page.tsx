import { VerificationStatus } from '@ustapilot/types';
import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { ProvidersPanel } from '@/features/admin/providers-panel';

export const metadata: Metadata = { title: 'Usta doğrulamaları' };

export default function VerificationsPage() {
  return (
    <>
      <Topbar
        title="Usta doğrulamaları"
        description="İnceleme bekleyen usta başvurularını karara bağlayın."
      />

      <main className="flex-1 space-y-6 p-6">
        <ProvidersPanel
          title="İnceleme bekleyenler"
          description="Verilen karar ustanın bekleyen belgelerine de uygulanır ve denetim kaydına yazılır."
          lockedStatus={VerificationStatus.PENDING}
        />
      </main>
    </>
  );
}
