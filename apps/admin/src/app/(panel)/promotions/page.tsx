import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Kampanyalar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Kod tanımı', detail: 'Kullanım limiti, geçerlilik süresi ve kapsam.' },
  { label: 'Hedefleme', detail: 'Şehir, kategori veya kullanıcı segmenti.' },
  { label: 'Kullanım raporu', detail: 'Kod başına kullanım ve maliyet.' },
  { label: 'Durdurma', detail: 'Aktif kampanyayı anında sonlandırma.' },
];

export default function PromotionsPage() {
  return (
    <ModuleScaffold
      title="Kampanyalar"
      description="İndirim kodları ve tanıtım kampanyaları oluşturun."
      dataSource="GET /admin/promotions"
      capabilities={CAPABILITIES}
    />
  );
}
