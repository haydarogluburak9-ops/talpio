'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@ustapilot/config';
import type { ProviderSummary } from '@ustapilot/types';
import { Badge, Card, CardContent, ErrorState, LoadingState } from '@ustapilot/ui';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

import { ProviderReviews } from './provider-reviews';

function useProvider(id: string) {
  return useQuery<ProviderSummary>({
    queryKey: queryKeys.providers.detail(id),
    queryFn: ({ signal }) => apiClient.providers.getById(id, signal),
    enabled: id.length > 0,
  });
}

/**
 * Ustanın herkese açık profili.
 *
 * Kart ve yorumlar giriş yapmamış ziyaretçiye de açıktır; bu yüzden sayfa
 * oturum durumuna hiç bakmaz.
 */
export function ProviderProfileBody({ providerId }: { providerId: string }) {
  const provider = useProvider(providerId);

  if (provider.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description="Usta profili yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
        action={{ label: t('common.retry'), onClick: () => void provider.refetch() }}
      />
    );
  }

  if (!provider.data) return <LoadingState label={t('common.loading')} />;

  return (
    <div className="flex flex-col gap-6">
      <ProviderCard provider={provider.data} />
      <ProviderReviews providerId={providerId} summary={provider.data} />
    </div>
  );
}

function ProviderCard({ provider }: { provider: ProviderSummary }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5 sm:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">{provider.displayName}</h1>
            <p className="text-sm text-foreground-muted">
              {provider.averageRating == null
                ? t('review.noRating')
                : `${provider.averageRating.toFixed(1)} ${t('provider.rating').toLocaleLowerCase('tr-TR')} · ${t('review.ratingCount', { count: provider.reviewCount })}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {provider.isVerified ? <Badge tone="success">{t('provider.verified')}</Badge> : null}
            {provider.isPremium ? <Badge tone="accent">Öncelikli usta</Badge> : null}
          </div>
        </div>

        {provider.categories.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {provider.categories.map((category) => (
              <li key={category.id}>
                <Badge tone="neutral">{category.name}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
          <Stat label={t('provider.completedJobs')} value={String(provider.completedJobCount)} />
          <Stat
            label={t('profile.reviews')}
            value={String(provider.reviewCount)}
          />
          <Stat
            label={t('provider.responseTime')}
            value={
              provider.averageResponseMinutes == null
                ? '—'
                : `${provider.averageResponseMinutes} dk`
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
