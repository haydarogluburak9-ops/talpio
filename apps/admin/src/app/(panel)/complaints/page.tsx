import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Şikâyetler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Şikâyet dosyası', detail: 'İlgili iş, taraflar ve kanıt dosyaları tek ekranda.' },
  { label: 'Taraf ifadeleri', detail: 'Her iki tarafın beyanının kayda alınması.' },
  { label: 'Karar', detail: 'İade, uyarı veya hesap kısıtlaması.' },
  { label: 'Tekrar eden şikâyet', detail: 'Aynı taraf hakkındaki geçmiş kayıtların görünmesi.' },
];

export default function ComplaintsPage() {
  return (
    <ModuleScaffold
      title="Şikâyetler"
      description="Müşteri ve usta şikâyetlerini inceleyip karara bağlayın."
      dataSource="GET /admin/complaints"
      capabilities={CAPABILITIES}
    />
  );
}
