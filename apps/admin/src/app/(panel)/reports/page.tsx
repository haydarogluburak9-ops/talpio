import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';

export const metadata: Metadata = { title: 'Raporlar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Büyüme', detail: 'Yeni kullanıcı, yeni usta ve talep sayısı zaman serisi.' },
  { label: 'Dönüşüm', detail: 'Talepten teklife, teklifden siparişe dönüşüm oranları.' },
  { label: 'Gelir', detail: 'Komisyon geliri ve ortalama sipariş tutarı.' },
  { label: 'Coğrafi dağılım', detail: 'Şehir bazlı talep ve usta yoğunluğu.' },
];

export default function ReportsPage() {
  return (
    <ModuleScaffold
      title="Raporlar"
      description="Platform büyümesini ve operasyonel göstergeleri izleyin."
      dataSource="GET /admin/dashboard"
      capabilities={CAPABILITIES}
    />
  );
}
