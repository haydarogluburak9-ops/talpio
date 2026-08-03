import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Sistem ayarları' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Varsayılanlar', detail: 'Ülke, para birimi, saat dilimi ve dil.' },
  { label: 'Özellik anahtarları', detail: 'Modülleri kod dağıtımı olmadan açıp kapatma.' },
  { label: 'Bakım modu', detail: 'İstemcilere bakım bildirimi gösterme.' },
  { label: 'Sağlayıcılar', detail: 'Ödeme, SMS ve e-posta sağlayıcı seçimi.' },
];

export default function SettingsPage() {
  return (
    <ModuleScaffold
      title="Sistem ayarları"
      description="Platform genelindeki yapılandırmayı yönetin."
      dataSource="GET /admin/settings"
      capabilities={CAPABILITIES}
    />
  );
}
