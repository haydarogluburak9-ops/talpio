import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { ReportsPanel } from '@/features/admin/reports-panel';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.reports') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Büyüme', detail: 'Yeni kullanıcı, yeni satıcı ve talep sayısı zaman serisi.' },
  { label: 'Dönüşüm', detail: 'Talepten teklife, teklifden siparişe dönüşüm oranları.' },
  { label: 'Gelir', detail: 'Komisyon geliri ve ortalama sipariş tutarı.' },
  { label: 'Coğrafi dağılım', detail: 'Şehir bazlı talep ve satıcı yoğunluğu.' },
];

export default function ReportsPage() {
  return (
    <ModuleScaffold
      titleKey="admin.reports"
      descriptionKey="admin.reportsHint"
      dataSource="GET /admin/dashboard"
      capabilities={CAPABILITIES}
    >
      <ReportsPanel />
    </ModuleScaffold>
  );
}
