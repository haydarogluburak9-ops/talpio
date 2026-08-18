import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { RolesPanel } from '@/features/admin/roles-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.roles') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Yetki matrisi', detail: 'Rol ve izin eşlemesinin salt okunur görünümü.' },
  { label: 'Personel rolleri', detail: 'Admin, süper admin ve destek rollerinin kapsamı.' },
  { label: 'Değişiklik geçmişi', detail: 'Rol atamalarının denetim kaydı.' },
  { label: 'Doğrulama', detail: 'Yetki kontrolü her zaman sunucuda uygulanır.' },
];

export default function RolesPage() {
  return (
    <ModuleScaffold
      titleKey="admin.roles"
      descriptionKey="admin.rolesHint"
      dataSource="GET /admin/settings/roles"
      capabilities={CAPABILITIES}
    >
      <RolesPanel />
    </ModuleScaffold>
  );
}
