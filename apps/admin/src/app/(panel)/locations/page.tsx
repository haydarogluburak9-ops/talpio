import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { LocationsPanel } from '@/features/catalog/locations-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.locations') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Ülke ekleme', detail: 'Yeni pazara açılırken ülke, para birimi ve saat dilimi.' },
  { label: 'Şehir ve ilçe', detail: 'Hiyerarşik konum kayıtlarının eklenip düzenlenmesi.' },
  { label: 'Hizmet kapsamı', detail: 'Bir bölgeyi hizmete kapatma veya açma.' },
  { label: 'Toplu içe aktarma', detail: 'Resmî idari bölünüş listesinden içe aktarma.' },
];

export default function LocationsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.locations"
      descriptionKey="admin.locationsHint"
      dataSource="POST/PATCH /admin/locations"
      capabilities={CAPABILITIES}
    >
      <LocationsPanel />
    </ModuleScaffold>
  );
}
