'use client';

import { formatMoneyMinor } from '@talpio/localization';
import type { CommerceRequest, RequestOffer } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import { BadgeCheck, Clock, Lock, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { getLocale, localeTag, t } from '@/lib/i18n';

import { useMyCommerceRequests, useMyRequestOffers } from './use-requests';

type HubTab = 'requests' | 'offers';

/** Alıcının hâlâ cevap beklediği talepler. */
const OPEN_STATUSES = new Set(['DRAFT', 'PUBLISHED', 'MATCHING', 'QUOTING']);

/**
 * Profildeki ticaret alanı.
 *
 * Alıcı bugüne kadar taleplerini `/tedariklerim`de, teklifleri ise her talebin
 * detay sayfasında ayrı ayrı görüyordu; kaç talebi varsa o kadar sayfa gezmesi
 * gerekiyordu. Bu panel ikisini tek yerde toplar.
 */
export function CommerceHub() {
  const [tab, setTab] = useState<HubTab>('requests');
  const requests = useMyCommerceRequests();
  const offers = useMyRequestOffers();

  if (requests.isPending || offers.isPending) return <ListSkeleton rows={3} />;

  if (requests.isError || offers.isError) {
    return (
      <div className="social-panel p-5">
        <ErrorState
          title={t('commerce.hubLoadFailed')}
          action={{
            label: t('common.retry'),
            onClick: () => {
              void requests.refetch();
              void offers.refetch();
            },
          }}
        />
      </div>
    );
  }

  const requestItems = requests.data?.items ?? [];
  const offerItems = offers.data ?? [];

  const openCount = requestItems.filter((row) => OPEN_STATUSES.has(row.status)).length;
  const pendingCount = offerItems.filter((row) => row.status === 'SUBMITTED').length;
  const acceptedCount = offerItems.filter((row) => row.status === 'ACCEPTED').length;

  const tabs: { id: HubTab; label: string; count: number }[] = [
    { id: 'requests', label: t('commerce.hubRequestsTab'), count: requestItems.length },
    { id: 'offers', label: t('commerce.hubOffersTab'), count: offerItems.length },
  ];

  return (
    <div className="space-y-3">
      <section className="social-panel overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 p-5">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-tight text-brand-900 dark:text-foreground">
              {t('commerce.hubTitle')}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted">{t('commerce.hubSubtitle')}</p>
          </div>
          <Link
            href="/tedarik"
            className="inline-flex h-10 shrink-0 items-center rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white hover:bg-accent-600"
          >
            {t('commerce.hubNewRequest')}
          </Link>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border/70">
          <Stat label={t('commerce.hubStatOpen')} value={openCount} />
          <Stat label={t('commerce.hubStatPending')} value={pendingCount} accent />
          <Stat label={t('commerce.hubStatAccepted')} value={acceptedCount} />
        </dl>
      </section>

      <div className="flex gap-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-current={tab === item.id}
            className={cn(
              'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors',
              tab === item.id
                ? 'bg-brand-900 text-white dark:bg-foreground dark:text-surface'
                : 'social-panel text-foreground-muted hover:text-foreground',
            )}
          >
            {item.label}
            <span
              className={cn(
                'rounded-full px-1.5 text-xs tabular-nums',
                tab === item.id ? 'bg-white/20' : 'bg-surface-muted',
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        requestItems.length === 0 ? (
          <div className="social-panel p-5">
            <EmptyState
              title={t('commerce.hubRequestsEmptyTitle')}
              description={t('commerce.hubRequestsEmptyBody')}
            />
          </div>
        ) : (
          <ul className="space-y-2">
            {requestItems.map((row) => (
              <RequestRow key={row.id} request={row} />
            ))}
          </ul>
        )
      ) : offerItems.length === 0 ? (
        <div className="social-panel p-5">
          <EmptyState
            title={t('commerce.hubOffersEmptyTitle')}
            description={t('commerce.hubOffersEmptyBody')}
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {offerItems.map((row) => (
            <OfferRow key={row.id} offer={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-xs font-medium text-foreground-muted">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 font-display text-2xl font-semibold tabular-nums',
          accent && value > 0 ? 'text-accent-600' : 'text-brand-900 dark:text-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function RequestRow({ request }: { request: CommerceRequest }) {
  const pending = request.pendingOfferCount ?? 0;
  const total = request.offerCount ?? 0;
  const isPrivate = request.visibility === 'INVITE_ONLY';

  return (
    <li>
      <Link
        href={`/tedarik/${request.id}`}
        className="social-panel block p-4 transition-colors hover:bg-surface-muted"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground">{request.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <StatusChip label={t(`requestStatus.${request.status}`)} />
              {isPrivate ? (
                <span
                  title={t('commerce.hubPrivateHint')}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted"
                >
                  <Lock className="size-3" aria-hidden />
                  {t('commerce.hubPrivate')}
                </span>
              ) : null}
              <span className="text-xs text-foreground-muted">
                {t('commerce.hubOfferCount', { count: total })}
              </span>
            </div>
          </div>

          {pending > 0 ? (
            <span className="shrink-0 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-semibold text-white">
              {t('commerce.hubPendingBadge', { count: pending })}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}

function OfferRow({ offer }: { offer: RequestOffer }) {
  const seller = offer.seller;
  const initials = (seller?.name ?? '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <li className="social-panel p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-900/5 text-sm font-semibold text-brand-900 dark:bg-foreground/10 dark:text-foreground">
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {seller?.username ? (
              <Link
                href={`/u/${seller.username}`}
                className="truncate font-semibold text-foreground hover:underline"
              >
                {seller.name}
              </Link>
            ) : (
              <span className="truncate font-semibold text-foreground">{seller?.name}</span>
            )}
            {seller?.isVerified ? (
              <BadgeCheck
                className="size-4 shrink-0 text-info-600"
                aria-label={t('commerce.hubVerified')}
              />
            ) : null}
          </div>

          {offer.request ? (
            <Link
              href={`/tedarik/${offer.request.id}`}
              className="mt-0.5 block truncate text-xs text-foreground-muted hover:underline"
            >
              {offer.request.title}
            </Link>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusChip label={t(`offerStatus.${offer.status}`)} />
            {offer.deliveryDays ? (
              <Meta icon={<Truck className="size-3" aria-hidden />}>
                {t('commerce.hubDeliveryDays', { count: offer.deliveryDays })}
              </Meta>
            ) : null}
            {offer.shippingIncluded ? (
              <Meta icon={<ShieldCheck className="size-3" aria-hidden />}>
                {t('social.shippingIncludedYes')}
              </Meta>
            ) : null}
            {offer.validUntil ? (
              <Meta icon={<Clock className="size-3" aria-hidden />}>
                {new Date(offer.validUntil).toLocaleDateString(localeTag())}
              </Meta>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-semibold tabular-nums text-brand-900 dark:text-foreground">
            {formatMoneyMinor(offer.amountMinor, offer.currency, getLocale())}
          </p>
          {offer.request ? (
            <Link
              href={`/tedarik/${offer.request.id}`}
              className="mt-1 inline-flex text-sm font-semibold text-accent-600 hover:text-accent-700"
            >
              {t('commerce.hubReview')}
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function StatusChip({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-border bg-surface px-2 py-0.5 text-xs font-medium text-foreground-muted">
      {label}
    </span>
  );
}

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
      {icon}
      {children}
    </span>
  );
}
