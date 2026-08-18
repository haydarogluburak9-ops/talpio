import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { PaymentsPanel } from '@/features/admin/payments-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.payments') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'İade', detail: 'Panelden kısmi ve tam iade başlatma.' },
  { label: 'Mutabakat', detail: 'Sağlayıcı raporuyla platform kayıtlarının karşılaştırılması.' },
  { label: 'Başarısız işlemler', detail: 'Yeniden deneme ve müşteriye bilgilendirme.' },
  { label: 'Dışa aktarma', detail: 'Muhasebe için tarih aralıklı CSV çıktısı.' },
];

export default function PaymentsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.payments"
      descriptionKey="admin.paymentsHint"
      dataSource="POST /payments/:id/refund"
      capabilities={CAPABILITIES}
    >
      <PaymentsPanel />
    </ModuleScaffold>
  );
}
