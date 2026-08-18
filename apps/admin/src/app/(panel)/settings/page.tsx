import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { SettingsPanel } from '@/features/admin/settings-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.settings') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Varsayılanlar', detail: 'Ülke, para birimi, saat dilimi ve dil.' },
  { label: 'Özellik anahtarları', detail: 'Modülleri kod dağıtımı olmadan açıp kapatma.' },
  { label: 'Bakım modu', detail: 'İstemcilere bakım bildirimi gösterme.' },
  { label: 'Sağlayıcılar', detail: 'Ödeme, SMS ve e-posta sağlayıcı seçimi.' },
];

export default function SettingsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.settings"
      descriptionKey="admin.settingsHint"
      dataSource="PATCH /admin/settings"
      capabilities={CAPABILITIES}
    >
      <SettingsPanel />
    </ModuleScaffold>
  );
}
