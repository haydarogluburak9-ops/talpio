import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Yetkiler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Yetki matrisi', detail: 'Rol ve izin eşlemesinin salt okunur görünümü.' },
  { label: 'Personel rolleri', detail: 'Admin, süper admin ve destek rollerinin kapsamı.' },
  { label: 'Değişiklik geçmişi', detail: 'Rol atamalarının denetim kaydı.' },
  { label: 'Doğrulama', detail: 'Yetki kontrolü her zaman sunucuda uygulanır.' },
];

export default function RolesPage() {
  return (
    <ModuleScaffold
      title="Yetkiler"
      description="Rollerin hangi işlemleri yapabileceğini görüntüleyin."
      dataSource="GET /admin/settings/roles"
      capabilities={CAPABILITIES}
    />
  );
}
