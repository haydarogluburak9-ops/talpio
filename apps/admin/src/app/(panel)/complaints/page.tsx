import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { ComplaintsPanel } from '@/features/admin/complaints-panel';

export const metadata: Metadata = { title: 'Şikâyetler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Şikâyet dosyası', detail: 'İlgili kayıt türü, taraflar ve açıklama.' },
  { label: 'İnceleme', detail: 'Durumu incelemede olarak işaretleme.' },
  { label: 'Karar', detail: 'Çözüm veya ret notu ile kapatma.' },
  { label: 'Geçmiş', detail: 'Raporlayan kullanıcı ve zaman damgası.' },
];

export default function ComplaintsPage() {
  return (
    <ModuleScaffold
      title="Şikâyetler"
      description="Müşteri ve usta şikâyetlerini inceleyip karara bağlayın."
      dataSource="GET /admin/complaints"
      capabilities={CAPABILITIES}
    >
      <ComplaintsPanel />
    </ModuleScaffold>
  );
}
