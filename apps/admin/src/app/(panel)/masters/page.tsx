import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { ProvidersPanel } from '@/features/admin/providers-panel';

import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.businesses') };

export default function MastersPage() {
  return (
    <>
      <Topbar titleKey="admin.businesses" descriptionKey="admin.businessesHint" />

      <main className="flex-1 space-y-6 p-6">
        <ProvidersPanel
          title="Satıcı profilleri"
          description="Puan, tamamlanan iş, hizmet ve bölge sayılarıyla tüm satıcılar."
        />
      </main>
    </>
  );
}
