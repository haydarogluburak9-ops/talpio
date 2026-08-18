'use client';

import { formatMoney, formatNumber } from '@talpio/localization';
import type { AdminDashboard } from '@talpio/types';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminDashboard } from './use-admin';

interface DistributionSlice {
  label: string;
  value: number;
}

export function ReportsPanel() {
  const dashboard = useAdminDashboard();

  if (dashboard.isPending) {
    return <ReportFrame>Rapor özeti yükleniyor…</ReportFrame>;
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <ReportFrame tone="danger">
        <p>Rapor verisi alınamadı. API sunucusunun çalıştığını doğrulayın.</p>
        <Button variant="outline" size="sm" onClick={() => void dashboard.refetch()}>
          Tekrar dene
        </Button>
      </ReportFrame>
    );
  }

  const data = dashboard.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Kullanıcılar"
          value={formatNumber(data.users.total)}
          hint={`${formatNumber(data.users.newThisWeek)} bu hafta katıldı`}
        />
        <MetricCard
          title="Açık talepler"
          value={formatNumber(data.jobs.open)}
          hint={`${formatNumber(data.jobs.total)} toplam talep`}
        />
        <MetricCard
          title="Aktif siparişler"
          value={formatNumber(data.orders.active)}
          hint={`${formatNumber(data.orders.completed)} tamamlandı`}
        />
        <MetricCard
          title="Komisyon"
          value={formatMoney(data.orders.commissionEarned)}
          hint={`Hacim ${formatMoney(data.orders.completedVolume)}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DistributionCard
          title="İş talepleri"
          description="Talep durum dağılımı"
          slices={[
            { label: 'Açık', value: data.jobs.open },
            { label: 'Tamamlanan', value: data.jobs.completed },
            { label: 'İptal', value: data.jobs.cancelled },
          ]}
        />
        <DistributionCard
          title="Teklifler"
          description="Teklif durum dağılımı"
          slices={[
            { label: 'Bekleyen', value: data.offers.pending },
            { label: 'Kabul', value: data.offers.accepted },
            {
              label: 'Diğer',
              value: Math.max(data.offers.total - data.offers.pending - data.offers.accepted, 0),
            },
          ]}
        />
        <DistributionCard
          title="Siparişler"
          description="Sipariş durum dağılımı"
          slices={[
            { label: 'Aktif', value: data.orders.active },
            { label: 'Tamamlanan', value: data.orders.completed },
            {
              label: 'Diğer',
              value: Math.max(data.orders.total - data.orders.active - data.orders.completed, 0),
            },
          ]}
        />
      </div>

      <UserMixCard data={data} />
    </div>
  );
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-foreground-muted">{hint}</p>
      </CardContent>
    </Card>
  );
}

function DistributionCard({
  title,
  description,
  slices,
}: {
  title: string;
  description: string;
  slices: DistributionSlice[];
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-foreground-muted">Bu grupta kayıt yok.</p>
        ) : (
          <>
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-muted">
              {slices.map((slice) => {
                if (slice.value <= 0) return null;
                const width = `${(slice.value / total) * 100}%`;
                return (
                  <div
                    key={slice.label}
                    className="h-full bg-brand-500"
                    style={{ width, opacity: opacityFor(slice.label) }}
                    title={`${slice.label}: ${formatNumber(slice.value)}`}
                  />
                );
              })}
            </div>
            <ul className="space-y-2">
              {slices.map((slice) => (
                <li key={slice.label} className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">{slice.label}</span>
                  <span className="tabular-nums font-medium">
                    {formatNumber(slice.value)}
                    {total > 0 ? (
                      <span className="ml-2 text-xs text-foreground-muted">
                        {Math.round((slice.value / total) * 100)}%
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UserMixCard({ data }: { data: AdminDashboard }) {
  const slices: DistributionSlice[] = [
    { label: 'Müşteri', value: data.users.customers },
    { label: 'Satıcı', value: data.users.providers },
    {
      label: 'Diğer',
      value: Math.max(data.users.total - data.users.customers - data.users.providers, 0),
    },
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kullanıcı rolleri</CardTitle>
          <CardDescription>Dashboard özetinden türetilen rol dağılımı.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {total === 0 ? (
            <p className="text-sm text-foreground-muted">Kullanıcı kaydı yok.</p>
          ) : (
            <ul className="space-y-2">
              {slices.map((slice) => (
                <li key={slice.label} className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">{slice.label}</span>
                  <span className="tabular-nums font-medium">
                    {formatNumber(slice.value)}
                    <span className="ml-2 text-xs text-foreground-muted">
                      {Math.round((slice.value / total) * 100)}%
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Satıcı doğrulama</CardTitle>
          <CardDescription>Doğrulama kuyruğu ve onaylı satıcı sayısı.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-foreground-muted">Doğrulanmış</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {formatNumber(data.providers.verified)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-muted">İnceleme bekleyen</dt>
              <dd className="text-xl font-semibold tabular-nums">
                {formatNumber(data.providers.pendingVerification)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportFrame({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'danger';
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operasyon özeti</CardTitle>
        <CardDescription>
          Ayrı bir rapor motoru yok; veriler <code className="font-mono text-xs">GET /admin/dashboard</code>{' '}
          özetinden türetilir.
        </CardDescription>
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

function opacityFor(label: string): number {
  if (label === 'Açık' || label === 'Bekleyen' || label === 'Aktif' || label === 'Müşteri') {
    return 1;
  }
  if (label === 'Tamamlanan' || label === 'Kabul' || label === 'Satıcı') return 0.72;
  return 0.4;
}
