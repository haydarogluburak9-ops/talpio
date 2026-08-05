import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Kampanyalar' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Kod tanımı', detail: 'Kullanım limiti, geçerlilik süresi ve kapsam.' },
  { label: 'Hedefleme', detail: 'Şehir, kategori veya kullanıcı segmenti.' },
  { label: 'Kullanım raporu', detail: 'Kod başına kullanım ve maliyet.' },
  { label: 'Durdurma', detail: 'Aktif kampanyayı anında sonlandırma.' },
];

export default function PromotionsPage() {
  return (
    <ModuleScaffold
      title="Kampanyalar"
      description="İndirim kodları ve tanıtım kampanyaları oluşturun."
      dataSource="GET /admin/promotions"
      capabilities={CAPABILITIES}
    >
      <Card>
        <CardHeader>
          <CardTitle>Veri modeli yok</CardTitle>
          <CardDescription>
            Bu modül için veri modeli henüz tanımlı değil. Kampanya listesi veya sahte kayıt
            gösterilmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-foreground-muted">
          Prisma şemasında Promotion modeli ve ilgili API uçları eklenene kadar bu ekran iskelet
          olarak kalır.
        </CardContent>
      </Card>
    </ModuleScaffold>
  );
}
