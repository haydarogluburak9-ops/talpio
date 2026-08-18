'use client';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemStatusCard } from '@/features/system-status/system-status-card';
import { useQueueHealth } from '@/features/system-status/use-system-health';
import { t } from '@/lib/i18n';

export default function SystemHealthPage() {
  const queues = useQueueHealth();
  const data = queues.data;

  return (
    <>
      <Topbar titleKey="admin.systemHealth" descriptionKey="admin.systemHealthHint" />
      <div className="space-y-4 p-6">
        <SystemStatusCard />
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.queue')}</CardTitle>
            <CardDescription>
              {data?.worker.alive ? t('admin.workerUp') : t('admin.workerDown')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {t('admin.queueWaiting')}: {data?.queues.notification?.waiting ?? 0}
            </p>
            <p>
              {t('admin.staleMatches')}: {data?.staleUnnotifiedMatches ?? 0}
            </p>
            <p>
              {t('admin.deadLetter')}: {data?.deadLetters.length ?? 0}
            </p>
            {data?.deadLetters.slice(0, 8).map((item) => (
              <p key={item.id} className="text-xs text-foreground-muted">
                {item.sourceQueue} · {item.failedReason}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
