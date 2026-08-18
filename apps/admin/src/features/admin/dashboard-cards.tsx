'use client';

import { formatMoney, formatNumber } from '@talpio/localization';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getLocale, t } from '@/lib/i18n';

import { useAdminDashboard } from './use-admin';

interface MetricGroup {
  title: string;
  metrics: { label: string; value: string; hint?: string }[];
}

export function DashboardCards() {
  const dashboard = useAdminDashboard();
  const locale = getLocale();

  if (dashboard.isPending) {
    return <SummaryFrame>{t('admin.summaryLoading')}</SummaryFrame>;
  }

  if (dashboard.isError) {
    return (
      <SummaryFrame tone="danger">
        <p>{t('admin.summaryError')}</p>
        <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}>
          {t('admin.retry')}
        </Button>
      </SummaryFrame>
    );
  }

  const data = dashboard.data;

  const groups: MetricGroup[] = [
    {
      title: t('admin.users'),
      metrics: [
        { label: t('admin.metricTotal'), value: formatNumber(data.users.total, locale) },
        { label: t('admin.metricCustomer'), value: formatNumber(data.users.customers, locale) },
        { label: t('admin.metricSeller'), value: formatNumber(data.users.providers, locale) },
        { label: t('admin.metricNewThisWeek'), value: formatNumber(data.users.newThisWeek, locale) },
      ],
    },
    {
      title: t('admin.sellerVerification'),
      metrics: [
        { label: t('admin.metricVerified'), value: formatNumber(data.providers.verified, locale) },
        {
          label: t('admin.metricPendingReview'),
          value: formatNumber(data.providers.pendingVerification, locale),
          hint: t('admin.metricPendingHint'),
        },
      ],
    },
    {
      title: t('admin.jobRequests'),
      metrics: [
        { label: t('admin.metricTotal'), value: formatNumber(data.jobs.total, locale) },
        { label: t('admin.metricOpen'), value: formatNumber(data.jobs.open, locale) },
        { label: t('admin.metricCompleted'), value: formatNumber(data.jobs.completed, locale) },
        { label: t('admin.metricCancelled'), value: formatNumber(data.jobs.cancelled, locale) },
      ],
    },
    {
      title: t('admin.offers'),
      metrics: [
        { label: t('admin.metricTotal'), value: formatNumber(data.offers.total, locale) },
        { label: t('admin.metricPending'), value: formatNumber(data.offers.pending, locale) },
        { label: t('admin.metricAccepted'), value: formatNumber(data.offers.accepted, locale) },
      ],
    },
    {
      title: t('admin.orders'),
      metrics: [
        { label: t('admin.metricTotal'), value: formatNumber(data.orders.total, locale) },
        { label: t('admin.metricActive'), value: formatNumber(data.orders.active, locale) },
        { label: t('admin.metricCompleted'), value: formatNumber(data.orders.completed, locale) },
      ],
    },
    {
      title: t('admin.groupFinance'),
      metrics: [
        {
          label: t('admin.metricCompletedVolume'),
          value: formatMoney(data.orders.completedVolume, locale),
          hint: t('admin.metricCompletedVolumeHint'),
        },
        {
          label: t('admin.metricCommission'),
          value: formatMoney(data.orders.commissionEarned, locale),
        },
      ],
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {group.metrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="text-xs text-foreground-muted">{metric.label}</dt>
                  <dd className="text-xl font-semibold tabular-nums">{metric.value}</dd>
                  {metric.hint ? (
                    <p className="text-xs text-foreground-muted">{metric.hint}</p>
                  ) : null}
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryFrame({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'danger';
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.summaryTitle')}</CardTitle>
        <CardDescription>{t('admin.summaryHint')}</CardDescription>
      </CardHeader>
      <CardContent
        {...(tone === 'danger' ? { role: 'alert' } : {})}
        className={
          tone === 'danger'
            ? 'flex flex-col items-start gap-3 text-sm text-danger-on-surface'
            : 'text-sm text-foreground-muted'
        }
      >
        {children}
      </CardContent>
    </Card>
  );
}
