import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { NotificationsPanel } from '@/features/admin/notifications-panel';

export const metadata: Metadata = { title: 'Bildirimler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Şablonlar', detail: 'Push, e-posta ve SMS için TR/EN metinler.' },
  { label: 'Toplu gönderim', detail: 'Segment seçimi ve zamanlanmış gönderim.' },
  { label: 'Teslim raporu', detail: 'Gönderilen, açılan ve başarısız bildirim sayıları.' },
  { label: 'Tercih denetimi', detail: 'Kullanıcının kapattığı kanallara gönderim yapılmaz.' },
];

export default function NotificationsPage() {
  return (
    <ModuleScaffold
      title="Bildirimler"
      description="Gönderilen bildirimleri izleyin; metinler istemci tarafında çözülür."
      dataSource="GET /admin/notifications"
      capabilities={CAPABILITIES}
    >
      <NotificationsPanel />
    </ModuleScaffold>
  );
}
