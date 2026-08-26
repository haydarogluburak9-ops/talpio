'use client';

import { formatNumber } from '@talpio/localization';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLocale, t } from '@/lib/i18n';

import { useAdminDashboard } from './use-admin';

/**
 * Kullanıcılar ekranının başlık sayacı.
 *
 * Sayı özet ucundan okunur, tablonun sayfalama bilgisinden değil: oradaki
 * toplam yalnızca o an uygulanan arama ve filtreye uyan kayıtları sayar.
 */
export function UsersStats() {
  const dashboard = useAdminDashboard();
  const locale = getLocale();

  if (dashboard.isPending) {
    return (
      <StatsFrame>
        <p className="text-sm text-foreground-muted">{t('admin.summaryLoading')}</p>
      </StatsFrame>
    );
  }

  if (dashboard.isError) {
    return (
      <StatsFrame>
        <div
          role="alert"
          className="flex flex-col items-start gap-3 text-sm text-danger-on-surface"
        >
          <p>{t('admin.summaryError')}</p>
          <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}>
            {t('admin.retry')}
          </Button>
        </div>
      </StatsFrame>
    );
  }

  const users = dashboard.data.users;

  const breakdown = [
    { label: t('admin.metricCustomer'), value: users.customers },
    { label: t('admin.metricSeller'), value: users.providers },
    { label: t('admin.metricNewThisWeek'), value: users.newThisWeek },
  ];

  return (
    <StatsFrame>
      <p className="text-4xl font-semibold tabular-nums" aria-live="polite">
        {formatNumber(users.total, locale)}
      </p>

      <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
        {breakdown.map((metric) => (
          <div key={metric.label}>
            <dt className="text-xs text-foreground-muted">{metric.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {formatNumber(metric.value, locale)}
            </dd>
          </div>
        ))}
      </dl>
    </StatsFrame>
  );
}

function StatsFrame({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('admin.registeredTotal')}</CardTitle>
        <CardDescription>{t('admin.registeredTotalHint')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
