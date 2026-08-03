import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Ödemeler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Ödeme listesi', detail: 'Sipariş, tutar ve sağlayıcı durumuna göre filtreleme.' },
  { label: 'İade', detail: 'Kısmi ve tam iade başlatma.' },
  { label: 'Mutabakat', detail: 'Sağlayıcı raporuyla platform kayıtlarının karşılaştırılması.' },
  { label: 'Başarısız işlemler', detail: 'Yeniden deneme ve müşteriye bilgilendirme.' },
];

export default function PaymentsPage() {
  return (
    <ModuleScaffold
      title="Ödemeler"
      description="Ödeme kayıtlarını, iadeleri ve başarısız işlemleri yönetin."
      dataSource="GET /admin/payments"
      capabilities={CAPABILITIES}
    />
  );
}
