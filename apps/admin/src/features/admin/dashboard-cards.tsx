'use client';

import { formatMoney, formatNumber } from '@ustapilot/localization';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminDashboard } from './use-admin';

interface MetricGroup {
  title: string;
  metrics: { label: string; value: string; hint?: string }[];
}

export function DashboardCards() {
  const dashboard = useAdminDashboard();

  if (dashboard.isPending) {
    return <SummaryFrame>Özet yükleniyor…</SummaryFrame>;
  }

  if (dashboard.isError) {
    return (
      <SummaryFrame tone="danger">
        <p>Özet alınamadı. API sunucusunun çalıştığını doğrulayın.</p>
        <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}>
          Tekrar dene
        </Button>
      </SummaryFrame>
    );
  }

  const data = dashboard.data;

  const groups: MetricGroup[] = [
    {
      title: 'Kullanıcılar',
      metrics: [
        { label: 'Toplam', value: formatNumber(data.users.total) },
        { label: 'Müşteri', value: formatNumber(data.users.customers) },
        { label: 'Usta', value: formatNumber(data.users.providers) },
        { label: 'Bu hafta katılan', value: formatNumber(data.users.newThisWeek) },
      ],
    },
    {
      title: 'Usta doğrulama',
      metrics: [
        { label: 'Doğrulanmış', value: formatNumber(data.providers.verified) },
        {
          label: 'İnceleme bekleyen',
          value: formatNumber(data.providers.pendingVerification),
          hint: 'Usta doğrulamaları ekranından karara bağlanır.',
        },
      ],
    },
    {
      title: 'İş talepleri',
      metrics: [
        { label: 'Toplam', value: formatNumber(data.jobs.total) },
        { label: 'Açık', value: formatNumber(data.jobs.open) },
        { label: 'Tamamlanan', value: formatNumber(data.jobs.completed) },
        { label: 'İptal', value: formatNumber(data.jobs.cancelled) },
      ],
    },
    {
      title: 'Teklifler',
      metrics: [
        { label: 'Toplam', value: formatNumber(data.offers.total) },
        { label: 'Bekleyen', value: formatNumber(data.offers.pending) },
        { label: 'Kabul edilen', value: formatNumber(data.offers.accepted) },
      ],
    },
    {
      title: 'Siparişler',
      metrics: [
        { label: 'Toplam', value: formatNumber(data.orders.total) },
        { label: 'Devam eden', value: formatNumber(data.orders.active) },
        { label: 'Tamamlanan', value: formatNumber(data.orders.completed) },
      ],
    },
    {
      title: 'Finans',
      metrics: [
        {
          label: 'Tamamlanan hacim',
          value: formatMoney(data.orders.completedVolume),
          hint: 'Yalnızca tamamlanmış siparişler.',
        },
        { label: 'Platform komisyonu', value: formatMoney(data.orders.commissionEarned) },
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
        <CardTitle>Platform özeti</CardTitle>
        <CardDescription>Kullanıcı, iş, teklif ve sipariş sayımları.</CardDescription>
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
