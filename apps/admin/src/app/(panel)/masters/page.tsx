import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { ProvidersPanel } from '@/features/admin/providers-panel';

export const metadata: Metadata = { title: 'Ustalar' };

export default function MastersPage() {
  return (
    <>
      <Topbar
        title="Ustalar"
        description="Usta profillerini, doğrulama durumlarını ve performanslarını izleyin."
      />

      <main className="flex-1 space-y-6 p-6">
        <ProvidersPanel
          title="Usta profilleri"
          description="Puan, tamamlanan iş, hizmet ve bölge sayılarıyla tüm ustalar."
        />
      </main>
    </>
  );
}
