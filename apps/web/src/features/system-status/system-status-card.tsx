'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { Badge, Button, Card, CardContent, ErrorState, Skeleton } from '@talpio/ui';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

const COMPONENT_LABELS: Record<string, string> = {
  database: 'PostgreSQL',
  redis: 'Redis',
};

export function SystemStatusCard() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: ({ signal }) => apiClient.health.ready(signal),
    refetchInterval: 30_000,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-2" aria-busy="true" aria-label={t('common.loading')}>
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t('system.unreachable')}
        description={t('status.networkErrorMessage')}
        action={{ label: t('common.retry'), onClick: () => void refetch() }}
      />
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex items-center justify-between gap-3">
          <Badge tone={data.isHealthy ? 'success' : 'danger'}>
            {data.isHealthy ? t('system.healthy') : t('system.degraded')}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label={t('common.refresh')}
          >
            <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} aria-hidden />
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {data.components.map((component) => (
            <li
              key={component.key}
              className="flex items-center justify-between gap-3 rounded-[--radius-control] bg-surface-muted px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {component.isUp ? (
                  <CheckCircle2 className="size-4 text-success-500" aria-hidden />
                ) : (
                  <AlertTriangle className="size-4 text-danger-500" aria-hidden />
                )}
                {COMPONENT_LABELS[component.key] ?? component.key}
              </span>

              <span className="flex items-center gap-3">
                {typeof component.responseTimeMs === 'number' ? (
                  <span className="text-xs text-foreground-muted">
                    {component.responseTimeMs} ms
                  </span>
                ) : null}
                <Badge tone={component.isUp ? 'success' : 'danger'}>
                  {component.isUp ? t('system.componentUp') : t('system.componentDown')}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
