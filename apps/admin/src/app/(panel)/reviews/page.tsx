import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { ReviewsPanel } from '@/features/admin/reviews-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.reviews') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Yorum kuyruğu', detail: 'Bildirilen ve düşük puanlı yorumlar önceliklendirilir.' },
  { label: 'İçerik denetimi', detail: 'Hakaret ve iletişim bilgisi içeren yorumların gizlenmesi.' },
  { label: 'Satıcı yanıtı', detail: 'Satıcının yanıt hakkı ve yanıt denetimi.' },
  { label: 'Puan yeniden hesaplama', detail: 'Kaldırılan yorum sonrası ortalama puanın güncellenmesi.' },
];

export default function ReviewsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.reviews"
      descriptionKey="admin.reviewsHint"
      dataSource="PATCH /admin/reviews/:id"
      capabilities={CAPABILITIES}
    >
      <ReviewsPanel />
    </ModuleScaffold>
  );
}
