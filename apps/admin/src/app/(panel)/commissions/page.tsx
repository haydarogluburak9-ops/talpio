import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { CommissionsPanel } from '@/features/admin/commissions-panel';

export const metadata: Metadata = { title: 'Komisyonlar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Oran düzenleme', detail: 'Baz puan cinsinden oran ve sabit tutarın panelden değişimi.' },
  { label: 'Geçerlilik aralığı', detail: 'Başlangıç ve bitiş tarihli kampanya oranları.' },
  { label: 'Simülasyon', detail: 'Kural değişikliğinin örnek tutar üzerindeki etkisi.' },
  { label: 'Değişiklik geçmişi', detail: 'Oranı kimin ne zaman değiştirdiğinin denetim kaydı.' },
];

export default function CommissionsPage() {
  return (
    <ModuleScaffold
      title="Komisyonlar"
      description="Kategori ve şehir bazlı komisyon kurallarını görüntüleyin."
      dataSource="PATCH /admin/commissions/:id"
      capabilities={CAPABILITIES}
    >
      <CommissionsPanel />
    </ModuleScaffold>
  );
}
