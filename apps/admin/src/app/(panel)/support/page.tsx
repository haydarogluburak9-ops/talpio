import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { SupportPanel } from '@/features/admin/support-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.supportTickets') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Talep kuyruğu', detail: 'Durum ve arama ile süzülmüş destek talepleri.' },
  { label: 'Yazışma', detail: 'Talep içi mesajlaşma; personel yanıtında bildirim gider.' },
  { label: 'Atama', detail: 'Talebi bir destek personeline atama.' },
  { label: 'Kapatma', detail: 'Durum güncelleme ve çözüm.' },
];

export default function SupportPage() {
  return (
    <ModuleScaffold
      titleKey="admin.supportTickets"
      descriptionKey="admin.supportHint"
      dataSource="GET /admin/support-tickets"
      capabilities={CAPABILITIES}
    >
      <SupportPanel />
    </ModuleScaffold>
  );
}
