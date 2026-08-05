import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { ReviewsPanel } from '@/features/admin/reviews-panel';

export const metadata: Metadata = { title: 'Yorumlar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Yorum kuyruğu', detail: 'Bildirilen ve düşük puanlı yorumlar önceliklendirilir.' },
  { label: 'İçerik denetimi', detail: 'Hakaret ve iletişim bilgisi içeren yorumların gizlenmesi.' },
  { label: 'Usta yanıtı', detail: 'Ustanın yanıt hakkı ve yanıt denetimi.' },
  { label: 'Puan yeniden hesaplama', detail: 'Kaldırılan yorum sonrası ortalama puanın güncellenmesi.' },
];

export default function ReviewsPage() {
  return (
    <ModuleScaffold
      title="Yorumlar"
      description="Değerlendirmeleri denetleyin ve kural dışı içerikleri kaldırın."
      dataSource="PATCH /admin/reviews/:id"
      capabilities={CAPABILITIES}
    >
      <ReviewsPanel />
    </ModuleScaffold>
  );
}
