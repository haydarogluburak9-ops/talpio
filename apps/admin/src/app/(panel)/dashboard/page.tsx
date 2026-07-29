import type { Metadata } from 'next';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStatusCard } from '@/features/system-status/system-status-card';

export const metadata: Metadata = { title: 'Panel' };

/**
 * Faz 1 panelinde yalnızca gerçek veriye dayanan bileşenler gösterilir.
 * İş metrikleri, ilgili modüller (Faz 2-8) tamamlandıkça eklenecektir.
 */
const UPCOMING_METRICS = [
  { label: 'Toplam kullanıcı', phase: 'Faz 2' },
  { label: 'Aktif usta', phase: 'Faz 3' },
  { label: 'Doğrulama bekleyen usta', phase: 'Faz 3' },
  { label: 'Açık iş talebi', phase: 'Faz 4' },
  { label: 'Tamamlanan iş', phase: 'Faz 7' },
  { label: 'Platform komisyonu', phase: 'Faz 9' },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar title="Panel" description="UstaPilot platform genel görünümü" />

      <main className="flex-1 space-y-6 p-6">
        <SystemStatusCard />

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan metrikler</CardTitle>
            <CardDescription>
              Bu göstergeler ilgili veri modelleri devreye alındığında gerçek verilerle
              doldurulacak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {UPCOMING_METRICS.map((metric) => (
                <li
                  key={metric.label}
                  className="rounded-[--radius-control] border border-dashed border-border p-4"
                >
                  <p className="text-sm font-medium">{metric.label}</p>
                  <p className="text-xs text-foreground-muted">{metric.phase} ile gelecek</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
