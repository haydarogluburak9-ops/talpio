import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Destek talepleri' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Talep kuyruğu', detail: 'Öncelik ve bekleme süresine göre sıralama.' },
  { label: 'Yazışma', detail: 'Talep içi mesajlaşma ve dosya eki.' },
  { label: 'Atama', detail: 'Talebi bir destek personeline atama.' },
  { label: 'Kapatma', detail: 'Çözüm notu ve memnuniyet anketi.' },
];

export default function SupportPage() {
  return (
    <ModuleScaffold
      title="Destek talepleri"
      description="Kullanıcı destek taleplerini yanıtlayın ve sonuçlandırın."
      dataSource="GET /admin/support-tickets"
      capabilities={CAPABILITIES}
    />
  );
}
