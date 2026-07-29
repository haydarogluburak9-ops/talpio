'use client';

import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api-client';

import { useSystemHealth } from './use-system-health';

const COMPONENT_LABELS: Record<string, string> = {
  database: 'PostgreSQL',
  redis: 'Redis',
};

export function SystemStatusCard() {
  const { data, isPending, isError, error, refetch, isFetching } = useSystemHealth();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Sistem durumu</CardTitle>
          <CardDescription>API ve bağımlı servislerin canlı durumu</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Durumu yenile"
        >
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} aria-hidden />
        </Button>
      </CardHeader>

      <CardContent>
        {isPending && (
          <div className="space-y-2" aria-busy="true" aria-label="Yükleniyor">
            <div className="skeleton h-10 rounded-[--radius-control]" />
            <div className="skeleton h-10 rounded-[--radius-control]" />
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 rounded-[--radius-control] bg-danger-50 p-4 text-sm dark:bg-danger-700/15">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-500" aria-hidden />
            <div className="space-y-2">
              <p className="font-medium text-danger-700 dark:text-danger-500">
                Durum bilgisi alınamadı
              </p>
              <p className="text-foreground-muted">
                {error instanceof ApiError
                  ? error.message
                  : 'API sunucusuna ulaşılamıyor. Backend çalışıyor mu?'}
              </p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Tekrar dene
              </Button>
            </div>
          </div>
        )}

        {data && (
          <ul className="space-y-2">
            {Object.entries(data.details).map(([key, detail]) => {
              const isUp = detail.status === 'up';
              return (
                <li
                  key={key}
                  className="flex items-center justify-between rounded-[--radius-control] bg-surface-muted px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {isUp ? (
                      <CheckCircle2 className="size-4 text-success-500" aria-hidden />
                    ) : (
                      <AlertTriangle className="size-4 text-danger-500" aria-hidden />
                    )}
                    {COMPONENT_LABELS[key] ?? key}
                  </span>

                  <span className="flex items-center gap-3">
                    {typeof detail.responseTimeMs === 'number' && (
                      <span className="text-xs text-foreground-muted">
                        {detail.responseTimeMs} ms
                      </span>
                    )}
                    <Badge tone={isUp ? 'success' : 'danger'}>
                      {isUp ? 'Çalışıyor' : 'Erişilemiyor'}
                    </Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
