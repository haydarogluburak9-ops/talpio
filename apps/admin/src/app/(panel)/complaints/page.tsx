import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { ComplaintsPanel } from '@/features/admin/complaints-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.complaints') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Şikâyet dosyası', detail: 'İlgili kayıt türü, taraflar ve açıklama.' },
  { label: 'İnceleme', detail: 'Durumu incelemede olarak işaretleme.' },
  { label: 'Karar', detail: 'Çözüm veya ret notu ile kapatma.' },
  { label: 'Geçmiş', detail: 'Raporlayan kullanıcı ve zaman damgası.' },
];

export default function ComplaintsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.complaints"
      descriptionKey="admin.complaintsHint"
      dataSource="GET /admin/complaints"
      capabilities={CAPABILITIES}
    >
      <ComplaintsPanel />
    </ModuleScaffold>
  );
}
