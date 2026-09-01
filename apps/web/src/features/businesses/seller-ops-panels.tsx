'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  COUNTRY_CURRENCY,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_TIMEZONE,
  queryKeys,
} from '@talpio/config';
import { Button, EmptyState, Input, ListSkeleton } from '@talpio/ui';
import Link from 'next/link';
import { useState } from 'react';

import { BusinessLetterheadForm } from '@/features/businesses/business-letterhead-form';
import { EmploymentClaimsPanel } from '@/features/businesses/employment-claims-panel';
import { VerificationDocumentsPanel } from '@/features/businesses/verification-documents-panel';
import { CurrencySelect } from '@/features/currency/currency-select';
import { useMyCurrency } from '@/features/currency/use-currency';
import { useMyBusinesses } from '@/features/requests/use-requests';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

export function SellerOpsPanels() {
  const businesses = useMyBusinesses();
  const list = (businesses.data as Array<{
    id: string;
    name: string;
    socialProfile?: { username?: string | null } | null;
  }> | undefined) ?? [];
  // Seçim boşken ilk işletmeye düşülür; ayrıca state'e yazmaya gerek yok.
  const [businessId, setBusinessId] = useState('');

  if (businesses.isPending) return <ListSkeleton rows={2} />;
  if (list.length === 0) {
    return (
      <div className="social-panel px-6 py-8">
        <EmptyState
          title="İşletme yok"
          description="CRM ve locale ayarları için önce satıcı işletmesi oluşturun."
        />
        <Link href="/satici-ol" className="mt-3 inline-block text-sm font-medium text-accent-600">
          Satıcı ol
        </Link>
      </div>
    );
  }

  const selected = list.find((b) => b.id === businessId) ?? list[0]!;

  return (
    <div className="flex flex-col gap-4">
      <div className="social-panel flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-foreground-muted">İşletme</span>
          <select
            value={selected.id}
            onChange={(e) => setBusinessId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-2"
          >
            {list.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        {selected.socialProfile?.username ? (
          <Link
            href={`/u/${selected.socialProfile.username}`}
            className="text-sm font-semibold text-accent-600 hover:underline"
          >
            Mağaza vitrini
          </Link>
        ) : null}
      </div>

      <VerificationDocumentsPanel />
      <EmploymentClaimsPanel businessId={selected.id} />
      <BusinessLetterheadForm />
      <LocaleSettingsForm businessId={selected.id} />
      <DashboardV2 businessId={selected.id} />
      <CrmAnalyticsStrip businessId={selected.id} />
      <CrmCustomersList businessId={selected.id} />
      <WorkOrdersBoard businessId={selected.id} />
      <TasksList businessId={selected.id} />
    </div>
  );
}

function LocaleSettingsForm({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'locale', businessId],
    queryFn: ({ signal }) => apiClient.businesses.getLocaleSettings(businessId, signal),
    enabled: Boolean(businessId),
  });
  const myCurrency = useMyCurrency();
  const [currency, setCurrency] = useState(myCurrency);
  const [country, setCountry] = useState(DEFAULT_COUNTRY_CODE);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  /**
   * Sunucudan gelen ayarları forma yansıtır. Effect yerine render sırasında
   * düzeltiyoruz: kullanıcı boş alanları bir kare boyunca görmüyor.
   */
  const loaded = settings.data;
  const [syncedFrom, setSyncedFrom] = useState(loaded);
  if (loaded && loaded !== syncedFrom) {
    setSyncedFrom(loaded);
    setCurrency(loaded.defaultCurrency);
    setCountry(loaded.defaultCountryCode);
    setTimezone(loaded.defaultTimezone);
  }

  const save = useMutation({
    mutationFn: () =>
      apiClient.businesses.updateLocaleSettings(businessId, {
        defaultCurrency: currency.toUpperCase(),
        defaultCountryCode: country.toUpperCase(),
        defaultTimezone: timezone,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all() });
      void settings.refetch();
    },
  });

  return (
    <section className="social-panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        {t('currency.businessLabel')}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {settings.isPending ? <ListSkeleton rows={2} /> : null}
        <div className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="text-foreground-muted">{t('currency.label')}</span>
          <CurrencySelect value={currency} onChange={setCurrency} />
          <span className="text-xs text-foreground-muted">{t('currency.businessHelp')}</span>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground-muted">{t('currency.countryLabel')}</span>
          <Input
            value={country}
            onChange={(e) => {
              const next = e.target.value.toUpperCase();
              setCountry(next);
              // Ülke değişince para birimi de takip eder; satıcı iki alanı ayrı
              // ayrı düzeltmeyi unuttuğunda ilanlar yanlış birimde yayımlanıyordu.
              const suggested = COUNTRY_CURRENCY[next];
              if (suggested) setCurrency(suggested);
            }}
            maxLength={2}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-foreground-muted">{t('currency.timezoneLabel')}</span>
          <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>
        <div className="sm:col-span-2">
          <Button
            type="button"
            size="sm"
            className="bg-accent-500 text-white hover:bg-accent-600"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </section>
  );
}

function CrmAnalyticsStrip({ businessId }: { businessId: string }) {
  const analytics = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'crm-analytics', businessId],
    queryFn: ({ signal }) => apiClient.businesses.getCrmAnalytics(businessId, signal),
    enabled: Boolean(businessId),
  });
  const reach = useQuery({
    queryKey: [...queryKeys.social.analyticsMe(), businessId],
    queryFn: ({ signal }) => apiClient.social.getAnalyticsBusiness(businessId, signal),
    enabled: Boolean(businessId),
  });
  const crm = analytics.data as {
    customerCount: number;
    openFollowUps: number;
    overdueFollowUps: number;
    lifetimeValueMinor: number;
  } | undefined;
  const social = reach.data;

  return (
    <section className="social-panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        CRM ve erişim
      </h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Metric label="Müşteri" value={crm?.customerCount ?? '—'} />
        <Metric label="Açık takip" value={crm?.openFollowUps ?? '—'} />
        <Metric label="Geciken takip" value={crm?.overdueFollowUps ?? '—'} />
        <Metric label="Görüntülenme" value={social?.totalViews ?? '—'} />
      </dl>
    </section>
  );
}

function CrmCustomersList({ businessId }: { businessId: string }) {
  const customers = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'crm', businessId],
    queryFn: ({ signal }) => apiClient.businesses.listCrmCustomers(businessId, signal),
    enabled: Boolean(businessId),
  });

  return (
    <section className="social-panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        CRM müşteriler
      </h3>
      <div className="mt-4">
        {customers.isPending ? <ListSkeleton rows={3} /> : null}
        {!customers.isPending && (customers.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Henüz müşteri yok"
            description="Marketplace sipariş köprüsü CRM kaydı oluşturduğunda burada listelenir."
          />
        ) : null}
        <ul className="divide-y divide-border/70">
          {(customers.data ?? []).map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium text-foreground">{row.displayName}</p>
                <p className="text-xs text-foreground-muted">
                  {[row.email, row.phone].filter(Boolean).join(' · ') || 'İletişim yok'}
                </p>
              </div>
              <span className="text-xs text-foreground-muted">
                {row._count.workOrders} iş emri
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function DashboardV2({ businessId }: { businessId: string }) {
  const dash = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'dashboard', businessId],
    queryFn: ({ signal }) => apiClient.businesses.getDashboard(businessId, signal),
    enabled: Boolean(businessId),
  });
  const trust = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'trust', businessId],
    queryFn: ({ signal }) => apiClient.businesses.getTrustScore(businessId, signal),
    enabled: Boolean(businessId),
  });
  const data = dash.data as {
    todayJobs: number;
    upcomingJobs: number;
    pendingOffers: number;
    pendingPayments: number;
    openRequests: number;
    leadCount: number;
    conversionRate: number | null;
    revenueMinor: number;
    currency: string;
    social: { postCount: number; totalViews: number; dealPostCount: number };
  } | undefined;
  const score = trust.data as { score: number } | undefined;

  return (
    <section className="social-panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        Bugünün özeti
      </h3>
      {dash.isPending ? <ListSkeleton rows={2} /> : null}
      {data ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Bugünkü iş" value={data.todayJobs} />
          <Metric label="Yaklaşan" value={data.upcomingJobs} />
          <Metric label="Bekleyen teklif" value={data.pendingOffers} />
          <Metric label="Bekleyen ödeme" value={data.pendingPayments} />
          <Metric label="Açık talep" value={data.openRequests} />
          <Metric label="CRM lead" value={data.leadCount} />
          <Metric
            label="Dönüşüm"
            value={data.conversionRate == null ? '—' : `%${data.conversionRate}`}
          />
          <Metric label="Güven skoru" value={score?.score ?? '—'} />
        </dl>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/70 p-3">
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="font-display text-lg font-semibold">{value}</dd>
    </div>
  );
}

function WorkOrdersBoard({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'wo-board', businessId],
    queryFn: ({ signal }) => apiClient.businesses.listWorkOrderBoard(businessId, signal),
    enabled: Boolean(businessId),
  });
  const columns =
    (list.data as { columns?: Record<string, Array<{ id: string; title: string; stage: string }>> } | undefined)
      ?.columns ?? {};
  const stages = ['NEW', 'DISCOVERY', 'QUOTE', 'APPROVED', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

  const update = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiClient.businesses.updateWorkOrderStage(businessId, id, stage),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all() });
    },
  });

  return (
    <section className="social-panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        İş emri panosu
      </h3>
      {list.isPending ? <ListSkeleton rows={2} /> : null}
      <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
        {stages.map((stage) => (
          <div key={stage} className="rounded-xl border border-border/70 p-3">
            <p className="text-xs font-semibold tracking-wide text-foreground-muted uppercase">
              {stage}
            </p>
            <ul className="mt-2 space-y-2">
              {(columns[stage] ?? []).map((row) => (
                <li key={row.id} className="rounded-lg bg-surface-muted/60 px-2 py-1.5 text-sm">
                  <p className="font-medium">{row.title}</p>
                  <select
                    value={row.stage}
                    className="mt-1 w-full rounded border border-border bg-surface px-1 py-0.5 text-xs"
                    onChange={(e) => update.mutate({ id: row.id, stage: e.target.value })}
                  >
                    {stages.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function TasksList({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const list = useQuery({
    queryKey: [...queryKeys.businesses.mine(), 'tasks', businessId],
    queryFn: ({ signal }) => apiClient.businesses.listTasks(businessId, signal),
    enabled: Boolean(businessId),
  });
  const create = useMutation({
    mutationFn: () => apiClient.businesses.createTask(businessId, { title }),
    onSuccess: () => {
      setTitle('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses.all() });
    },
  });
  const rows = (list.data as Array<{ id: string; title: string; status: string }> | undefined) ?? [];

  return (
    <section className="social-panel p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        Görevler
      </h3>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate();
        }}
      >
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Görev başlığı" />
        <Button type="submit" size="sm" disabled={create.isPending}>
          Ekle
        </Button>
      </form>
      <ul className="mt-3 divide-y divide-border/70 text-sm">
        {rows.map((row) => (
          <li key={row.id} className="flex justify-between py-2">
            <span>{row.title}</span>
            <span className="text-foreground-muted">{row.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
