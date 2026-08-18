import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { CommissionsPanel } from '@/features/admin/commissions-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.commissions') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Oran düzenleme', detail: 'Baz puan cinsinden oran ve sabit tutarın panelden değişimi.' },
  { label: 'Geçerlilik aralığı', detail: 'Başlangıç ve bitiş tarihli kampanya oranları.' },
  { label: 'Simülasyon', detail: 'Kural değişikliğinin örnek tutar üzerindeki etkisi.' },
  { label: 'Değişiklik geçmişi', detail: 'Oranı kimin ne zaman değiştirdiğinin denetim kaydı.' },
];

export default function CommissionsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.commissions"
      descriptionKey="admin.commissionsHint"
      dataSource="PATCH /admin/commissions/:id"
      capabilities={CAPABILITIES}
    >
      <CommissionsPanel />
    </ModuleScaffold>
  );
}
