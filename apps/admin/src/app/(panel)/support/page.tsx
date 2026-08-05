import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { SupportPanel } from '@/features/admin/support-panel';

export const metadata: Metadata = { title: 'Destek talepleri' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Talep kuyruğu', detail: 'Durum ve arama ile süzülmüş destek talepleri.' },
  { label: 'Yazışma', detail: 'Talep içi mesajlaşma; personel yanıtında bildirim gider.' },
  { label: 'Atama', detail: 'Talebi bir destek personeline atama.' },
  { label: 'Kapatma', detail: 'Durum güncelleme ve çözüm.' },
];

export default function SupportPage() {
  return (
    <ModuleScaffold
      title="Destek talepleri"
      description="Kullanıcı destek taleplerini yanıtlayın ve sonuçlandırın."
      dataSource="GET /admin/support-tickets"
      capabilities={CAPABILITIES}
    >
      <SupportPanel />
    </ModuleScaffold>
  );
}
