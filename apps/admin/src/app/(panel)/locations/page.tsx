import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { LocationsPanel } from '@/features/catalog/locations-panel';

export const metadata: Metadata = { title: 'Konumlar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Ülke ekleme', detail: 'Yeni pazara açılırken ülke, para birimi ve saat dilimi.' },
  { label: 'Şehir ve ilçe', detail: 'Hiyerarşik konum kayıtlarının eklenip düzenlenmesi.' },
  { label: 'Hizmet kapsamı', detail: 'Bir bölgeyi hizmete kapatma veya açma.' },
  { label: 'Toplu içe aktarma', detail: 'Resmî idari bölünüş listesinden içe aktarma.' },
];

export default function LocationsPage() {
  return (
    <ModuleScaffold
      title="Konumlar"
      description="Ülke, şehir ve ilçe hiyerarşisini yönetin."
      dataSource="POST/PATCH /admin/locations"
      capabilities={CAPABILITIES}
    >
      <LocationsPanel />
    </ModuleScaffold>
  );
}
