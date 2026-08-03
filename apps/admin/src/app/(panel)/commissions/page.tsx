import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Komisyonlar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Kural listesi', detail: 'Kapsam önceliğine göre sıralı komisyon kuralları.' },
  { label: 'Oran düzenleme', detail: 'Baz puan cinsinden oran ve sabit tutar.' },
  { label: 'Geçerlilik aralığı', detail: 'Başlangıç ve bitiş tarihli kampanya oranları.' },
  { label: 'Simülasyon', detail: 'Kural değişikliğinin örnek tutar üzerindeki etkisi.' },
];

export default function CommissionsPage() {
  return (
    <ModuleScaffold
      title="Komisyonlar"
      description="Kategori ve şehir bazlı komisyon kurallarını tanımlayın."
      dataSource="GET /admin/commissions"
      capabilities={CAPABILITIES}
    />
  );
}
