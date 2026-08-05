import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Abonelikler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Paket tanımı', detail: 'Paket adı, süresi ve sağladığı ayrıcalıklar.' },
  { label: 'Abone listesi', detail: 'Aktif, süresi dolmuş ve iptal edilmiş abonelikler.' },
  { label: 'Yenileme', detail: 'Otomatik yenileme durumu ve başarısız tahsilatlar.' },
  { label: 'Kullanım', detail: 'Paket ayrıcalıklarının ne kadar kullanıldığı.' },
];

export default function SubscriptionsPage() {
  return (
    <ModuleScaffold
      title="Abonelikler"
      description="Usta abonelik paketlerini ve yenilemeleri yönetin."
      dataSource="GET /admin/subscriptions"
      capabilities={CAPABILITIES}
    >
      <Card>
        <CardHeader>
          <CardTitle>Veri modeli yok</CardTitle>
          <CardDescription>
            Bu modül için veri modeli henüz tanımlı değil. Abonelik listesi veya sahte kayıt
            gösterilmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-foreground-muted">
          Prisma şemasında Subscription modeli ve ilgili API uçları eklenene kadar bu ekran iskelet
          olarak kalır.
        </CardContent>
      </Card>
    </ModuleScaffold>
  );
}
