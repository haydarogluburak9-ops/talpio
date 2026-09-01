'use client';

import { formatMoneyMinor } from '@talpio/localization';
import type { CommerceRequest, RequestOffer } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Clock, Lock, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { getLocale, localeTag, t } from '@/lib/i18n';

import { useMatchedRequests, useMyCommerceRequests, useMyRequestOffers } from './use-requests';

/** Alıcının hâlâ cevap beklediği talepler. */
const OPEN_STATUSES = new Set(['DRAFT', 'PUBLISHED', 'MATCHING', 'QUOTING']);

/**
 * Profildeki ticaret alanı.
 *
 * Alış ve satış aynı listede karışmasın diye iki ayrı kutu: senin açtığın
 * talepler (satıcılar teklif yazar) ve sana gelen talepler (sen teklif verirsin).
 */
export function CommerceHub() {
  const requests = useMyCommerceRequests();
  const offers = useMyRequestOffers();
  const incoming = useMatchedRequests();

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
              void incoming.refetch();
            },
          }}
        />
      </div>
    );
  }

  const requestItems = requests.data?.items ?? [];
  const offerItems = offers.data ?? [];
  const incomingItems = incoming.isError ? [] : (incoming.data?.items ?? []);

  const openCount = requestItems.filter((row) => OPEN_STATUSES.has(row.status)).length;
  const pendingCount = offerItems.filter((row) => row.status === 'SUBMITTED').length;

  return (
    <div className="space-y-4">
      <section className="social-panel overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 p-5">
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
      </section>

      <Lane
        tone="buy"
        icon={<ArrowUpRight className="size-4" aria-hidden />}
        title={t('commerce.hubBuyLaneTitle')}
        hint={t('commerce.hubBuyLaneHint')}
        countLabel={t('commerce.hubStatOpen')}
        count={openCount}
      >
        {requestItems.length === 0 ? (
          <EmptyState
            title={t('commerce.hubRequestsEmptyTitle')}
            description={t('commerce.hubRequestsEmptyBody')}
          />
        ) : (
          <ul className="space-y-2">
            {requestItems.map((row) => (
              <RequestRow key={row.id} request={row} direction="out" />
            ))}
          </ul>
        )}

        <div className="mt-5 border-t border-border/70 pt-4">
          <h3 className="text-sm font-semibold text-foreground">{t('commerce.hubOffersOnYoursTitle')}</h3>
          <p className="mt-0.5 text-xs text-foreground-muted">{t('commerce.hubOffersOnYoursHint')}</p>
          {offerItems.length === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted">{t('commerce.hubOffersEmptyBody')}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {offerItems.map((row) => (
                <OfferRow key={row.id} offer={row} />
              ))}
            </ul>
          )}
          {pendingCount > 0 ? (
            <p className="mt-2 text-xs font-semibold text-accent-600">
              {t('commerce.hubPendingBadge', { count: pendingCount })}
            </p>
          ) : null}
        </div>
      </Lane>

      <Lane
        tone="sell"
        icon={<ArrowDownLeft className="size-4" aria-hidden />}
        title={t('commerce.hubSellLaneTitle')}
        hint={t('commerce.hubSellLaneHint')}
        countLabel={t('commerce.hubSellLaneTitle')}
        count={incoming.isPending ? undefined : incomingItems.length}
      >
        {incoming.isPending ? (
          <ListSkeleton rows={2} />
        ) : incomingItems.length === 0 ? (
          <EmptyState
            title={t('commerce.hubIncomingEmptyTitle')}
            description={t('commerce.hubIncomingEmptyBody')}
          />
        ) : (
          <ul className="space-y-2">
            {incomingItems.map((row) => (
              <RequestRow key={row.id} request={row} direction="in" />
            ))}
          </ul>
        )}
      </Lane>
    </div>
  );
}

function Lane({
  tone,
  icon,
  title,
  hint,
  count,
  countLabel,
  children,
}: {
  tone: 'buy' | 'sell';
  icon: ReactNode;
  title: string;
  hint: string;
  count?: number;
  countLabel: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'social-panel overflow-hidden border-l-4',
        tone === 'buy' ? 'border-l-accent-500' : 'border-l-info-600',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="min-w-0">
          <p
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide',
              tone === 'buy' ? 'text-accent-600' : 'text-info-600',
            )}
          >
            {icon}
            {tone === 'buy' ? t('commerce.hubYouOpened') : t('commerce.hubCameToYou')}
          </p>
          <h3 className="mt-1 font-display text-base font-semibold text-brand-900 dark:text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">{hint}</p>
        </div>
        {count != null ? (
          <p className="shrink-0 text-right">
            <span className="block font-display text-2xl font-semibold tabular-nums text-brand-900 dark:text-foreground">
              {count}
            </span>
            <span className="text-xs text-foreground-muted">{countLabel}</span>
          </p>
        ) : null}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function RequestRow({
  request,
  direction,
}: {
  request: CommerceRequest;
  direction: 'out' | 'in';
}) {
  const pending = request.pendingOfferCount ?? 0;
  const total = request.offerCount ?? 0;
  const isPrivate = request.visibility === 'INVITE_ONLY';
  const dated = request.publishedAt ?? request.createdAt;

  return (
    <li>
      <Link
        href={direction === 'in' ? `/tedarik/${request.id}#teklif-ver` : `/tedarik/${request.id}`}
        className="block rounded-xl border border-border/80 bg-surface p-4 transition-colors hover:bg-surface-muted"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                direction === 'out'
                  ? 'bg-accent-500/12 text-accent-700 dark:text-accent-400'
                  : 'bg-info-50 text-info-700 dark:bg-info-600/15 dark:text-info-400',
              )}
            >
              {direction === 'out' ? t('commerce.hubYouOpened') : t('commerce.hubCameToYou')}
            </span>
            <p className="mt-2 truncate font-semibold text-foreground">{request.title}</p>
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
              {direction === 'out' ? (
                <span className="text-xs text-foreground-muted">
                  {t('commerce.hubOfferCount', { count: total })}
                </span>
              ) : (
                <span className="text-xs font-medium text-info-600">
                  {t('commerce.hubAwaitingYourOffer')}
                </span>
              )}
              {request.quantity ? (
                <span className="text-xs text-foreground-muted">
                  {request.quantity}
                  {request.unit ? ` ${request.unit}` : ''}
                </span>
              ) : null}
              {dated ? (
                <span className="text-xs text-foreground-muted">
                  {new Date(dated).toLocaleDateString(localeTag())}
                </span>
              ) : null}
            </div>
          </div>

          {direction === 'in' ? (
            <span className="shrink-0 rounded-lg bg-info-600 px-2.5 py-1 text-xs font-semibold text-white">
              {t('commerce.hubGiveOffer')}
            </span>
          ) : pending > 0 ? (
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
    <li className="rounded-xl border border-border/80 bg-surface p-4">
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

          {offer.note ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-foreground">{offer.note}</p>
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

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
      {icon}
      {children}
    </span>
  );
}
