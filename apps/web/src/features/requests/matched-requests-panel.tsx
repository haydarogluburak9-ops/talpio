'use client';

import { ListSkeleton } from '@talpio/ui';
import Link from 'next/link';

import { OfferForm } from '@/features/offers/offer-form';
import { t } from '@/lib/i18n';

import { useMatchedRequests, useMyBusinesses } from './use-requests';

export function MatchedRequestsPanel() {
  const matched = useMatchedRequests();
  const businesses = useMyBusinesses();

  if (matched.isPending) return <ListSkeleton rows={3} />;

  if (matched.isError) {
    return (
      <div className="social-panel p-5">
        <p className="text-sm text-foreground-muted">
          {t('commerce.matchedLoadFailed')}{' '}
          <button type="button" className="underline" onClick={() => void matched.refetch()}>
            {t('common.retry')}
          </button>
        </p>
      </div>
    );
  }

  const items = matched.data?.items ?? [];
  const businessList = (businesses.data as Array<{ id: string; name: string }> | undefined) ?? [];

  if (items.length === 0) {
    return (
      <div className="social-panel p-5">
        <p className="text-sm text-foreground-muted">{t('commerce.matchedEmpty')}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3 pb-20 lg:pb-6">
      {items.map((request) => (
        <li key={request.id} className="social-panel p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="rounded-md bg-accent-500 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
                {t('social.requestBadge')}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold text-brand-900 dark:text-foreground">
                {request.title}
              </h3>
              {request.matchScore != null ? (
                <p className="mt-1 text-xs font-semibold text-accent-600">
                  {t('match.score', { score: request.matchScore })}
                </p>
              ) : null}
              {request.matchReasons && request.matchReasons.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-foreground-muted">
                  {request.matchReasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-1 text-sm text-foreground-muted">{request.description}</p>
              {request.deliveryAddressText || request.deliveryCityId ? (
                <p className="mt-1 text-xs text-foreground-muted">
                  {t('social.dealLocation')}:{' '}
                  {request.deliveryAddressText ?? request.deliveryCityId}
                </p>
              ) : null}
            </div>
            <Link
              href={`/tedarik/${request.id}`}
              className="text-sm font-semibold text-accent-600 hover:underline"
            >
              {t('common.details')}
            </Link>
          </div>
          {businessList[0] ? (
            <OfferForm requestId={request.id} businessId={businessList[0].id} />
          ) : (
            <p className="text-sm text-foreground-muted">{t('commerce.businessRequired')}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
