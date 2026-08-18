'use client';

import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api-client';
import { t } from '@/lib/i18n';

import { useQueueHealth, useSystemHealth } from './use-system-health';

const COMPONENT_LABELS: Record<string, string> = {
  database: t('admin.database'),
  redis: t('admin.redis'),
  storage: t('admin.storage'),
  queue: t('admin.queue'),
  ai: t('admin.ai'),
};

export function SystemStatusCard() {
  const { data, isPending, isError, error, refetch, isFetching } = useSystemHealth();
  const queues = useQueueHealth();
  const workerDown = queues.data ? !queues.data.worker.alive : false;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t('admin.systemHealth')}</CardTitle>
          <CardDescription>{t('admin.systemHealthHint')}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void refetch();
            void queues.refetch();
          }}
          disabled={isFetching}
          aria-label={t('admin.retry')}
        >
          <RefreshCw className={isFetching ? 'size-4 animate-spin' : 'size-4'} aria-hidden />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {workerDown ? (
          <div className="flex items-start gap-3 rounded-[--radius-control] border border-danger-500/30 bg-danger-surface p-3 text-sm text-danger-on-surface">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{t('admin.workerDown')}</p>
              {queues.data ? (
                <p className="mt-1 text-xs">
                  {t('admin.queueWaiting')}: {queues.data.queues.notification?.waiting ?? 0} ·{' '}
                  {t('admin.staleMatches')}: {queues.data.staleUnnotifiedMatches} ·{' '}
                  {t('admin.deadLetter')}: {queues.data.deadLetters.length}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {isPending && (
          <div className="space-y-2" aria-busy="true">
            <div className="skeleton h-10 rounded-[--radius-control]" />
            <div className="skeleton h-10 rounded-[--radius-control]" />
          </div>
        )}

        {isError && (
          <div className="flex items-start gap-3 rounded-[--radius-control] bg-danger-surface p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-on-surface" aria-hidden />
            <div className="space-y-2">
              <p className="font-medium text-danger-on-surface">{t('admin.summaryError')}</p>
              <p className="text-foreground-muted">
                {error instanceof ApiError ? error.message : t('admin.loginError')}
              </p>
            </div>
          </div>
        )}

        {data && (
          <ul className="space-y-2">
            {data.components.map((component) => (
              <li
                key={component.key}
                className="flex items-center justify-between rounded-[--radius-control] bg-surface-muted px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {component.isUp ? (
                    <CheckCircle2 className="size-4 text-success-500" aria-hidden />
                  ) : (
                    <AlertTriangle className="size-4 text-danger-500" aria-hidden />
                  )}
                  {COMPONENT_LABELS[component.key] ?? component.key}
                </span>
                <Badge tone={component.isUp ? 'success' : 'danger'}>
                  {component.isUp ? t('admin.componentUp') : t('admin.componentDown')}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <Link href="/system-health" className="inline-block text-xs font-medium text-accent-600 hover:underline">
          {t('admin.systemHealth')}
        </Link>
      </CardContent>
    </Card>
  );
}
