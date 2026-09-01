'use client';

import { compareOffers } from '@talpio/business-logic';
import type { RequestOffer } from '@talpio/types';
import { Button, ListSkeleton, LoadingState } from '@talpio/ui';
import { BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { useSession } from '@/features/auth/use-session';
import { OfferForm } from '@/features/offers/offer-form';
import { OfferSummary } from '@/features/offers/offer-summary';
import { useShareRequestToFeed } from '@/features/social/use-social';
import { t } from '@/lib/i18n';

import {
  useAcceptRequestOffer,
  useCommerceRequest,
  useMyBusinesses,
  usePublishCommerceRequest,
  useRequestOffers,
} from './use-requests';

/** Yalnızca bu durumlarda backend yeni teklif kabul eder. */
const OFFER_OPEN_STATUSES = new Set(['PUBLISHED', 'MATCHING', 'QUOTING']);

export function RequestDetail({ id }: { id: string }) {
  const session = useSession();
  const request = useCommerceRequest(id);
  const offers = useRequestOffers(id);
  const accept = useAcceptRequestOffer();
  const publish = usePublishCommerceRequest(id);
  const share = useShareRequestToFeed();
  const viewer = session.data ?? null;
  const isBuyer = Boolean(viewer && request.data && viewer.id === request.data.buyerUserId);
  const canOffer =
    Boolean(viewer) &&
    Boolean(request.data) &&
    !isBuyer &&
    OFFER_OPEN_STATUSES.has(request.data?.status ?? '');
  const businesses = useMyBusinesses(canOffer);
  const comparison = useMemo(
    () =>
      compareOffers(
        (offers.data ?? []).map((offer) => ({
          id: offer.id,
          amountMinor: offer.amountMinor,
          deliveryDays: offer.deliveryDays ?? null,
        })),
      ),
    [offers.data],
  );

  if (request.isPending) return <LoadingState label={t('commerce.loading')} />;
  if (request.isError || !request.data) {
    return (
      <div className="social-panel p-5">
        <p className="text-sm text-foreground-muted">{t('commerce.notFound')}</p>
      </div>
    );
  }

  const row = request.data;
  const myBusinesses = (businesses.data as Array<{ id: string; name: string }> | undefined) ?? [];

  return (
    <div className="flex flex-col gap-4 pb-20 lg:pb-6">
      <header className="social-panel space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-accent-500 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
            {t('social.requestBadge')}
          </span>
          <span className="text-xs font-medium text-foreground-muted">{row.status}</span>
        </div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
          {row.title}
        </h1>
        <p className="text-sm leading-relaxed text-foreground-muted">{row.description}</p>
        {row.quantity ? (
          <p className="text-sm text-foreground">
            {t('commerce.fieldQuantity')}: {row.quantity}
            {row.unit ? ` ${row.unit}` : ''}
          </p>
        ) : null}
        {row.deliveryAddressText ? (
          <p className="text-sm text-foreground-muted">
            {t('social.dealLocation')}: {row.deliveryAddressText}
          </p>
        ) : null}
        {isBuyer ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={share.isPending}
              onClick={() => share.mutate({ requestId: id })}
            >
              {share.isPending ? t('social.sharingToFeed') : t('social.shareToFeed')}
            </Button>
            {share.isSuccess ? (
              <Link href="/akis" className="text-sm font-medium text-accent-600 hover:underline">
                {t('social.goToFeed')}
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>

      {isBuyer ? (
        <DistributionStatus
          status={row.status}
          matchCount={row.matchCount ?? null}
          publishing={publish.isPending}
          failed={publish.isError}
          onPublish={() => publish.mutate()}
        />
      ) : null}

      {canOffer ? (
        <section id="teklif-ver" className="social-panel scroll-mt-24 p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            {t('social.giveOffer')}
          </h2>
          <div className="mt-4">
            {businesses.isPending ? (
              <ListSkeleton rows={1} />
            ) : myBusinesses[0] ? (
              <OfferForm
                requestId={id}
                businessId={myBusinesses[0].id}
                request={{
                  title: row.title,
                  description: row.description,
                  quantity: row.quantity,
                  unit: row.unit,
                  deliveryAddressText: row.deliveryAddressText,
                }}
              />
            ) : (
              <p className="text-sm text-foreground-muted">{t('commerce.businessRequired')}</p>
            )}
          </div>
        </section>
      ) : null}

      {isBuyer ? (
        <section className="social-panel p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
            {t('offer.compareTitle')}
          </h2>
          <div className="mt-4">
            {offers.isPending ? <ListSkeleton rows={2} /> : null}
            {offers.data?.length === 0 ? (
              <p className="text-sm text-foreground-muted">{t('commerce.noOffers')}</p>
            ) : null}
            {(offers.data ?? []).length > 0 ? (
              <ul className="flex flex-col gap-3">
                {(offers.data ?? []).map((offer) => (
                  <li
                    key={offer.id}
                    className="flex flex-col gap-3 rounded-xl bg-surface-muted/60 px-4 py-3 ring-1 ring-border/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <SellerName offer={offer} />
                      {isBuyer && offer.status === 'SUBMITTED' ? (
                        <Button
                          size="sm"
                          className="bg-accent-500 text-white hover:bg-accent-600"
                          disabled={accept.isPending}
                          onClick={() => accept.mutate(offer.id)}
                        >
                          {t('offer.accept')}
                        </Button>
                      ) : (
                        <span className="text-xs text-foreground-muted">
                          {t(`offerStatus.${offer.status}`)}
                        </span>
                      )}
                    </div>
                    <OfferSummary offer={offer} />
                    <OfferBadges
                      badges={[
                        ...(offer.badges ?? []),
                        ...(comparison.badgesByOfferId[offer.id] ?? []),
                      ]}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/** Teklifi veren mağaza; sosyal profili varsa profiline bağlanır. */
function SellerName({ offer }: { offer: RequestOffer }) {
  const seller = offer.seller;
  if (!seller) return null;

  return (
    <span className="flex items-center gap-1.5">
      {seller.username ? (
        <Link href={`/u/${seller.username}`} className="font-semibold hover:underline">
          {seller.name}
        </Link>
      ) : (
        <span className="font-semibold">{seller.name}</span>
      )}
      {seller.isVerified ? (
        <BadgeCheck className="size-4 shrink-0 text-info-600" aria-label={t('commerce.hubVerified')} />
      ) : null}
    </span>
  );
}

/**
 * Talebin dağıtım durumu: yayında mı, kaç işletmeyle eşleşti. Sıfır eşleşme
 * sessizce boş bırakılmaz; kullanıcıya açıkça söylenir.
 */
function DistributionStatus({
  status,
  matchCount,
  publishing,
  failed,
  onPublish,
}: {
  status: string;
  matchCount: number | null;
  publishing: boolean;
  failed: boolean;
  onPublish: () => void;
}) {
  if (status === 'DRAFT') {
    return (
      <section className="social-panel space-y-3 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
          {t('commerce.distributionDraftTitle')}
        </h2>
        <p className="text-sm text-foreground-muted">{t('commerce.distributionDraftBody')}</p>
        <Button type="button" size="sm" disabled={publishing} onClick={onPublish}>
          {publishing ? t('commerce.distributionPublishing') : t('commerce.distributionPublish')}
        </Button>
        {failed ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            {t('commerce.distributionPublishFailed')}
          </p>
        ) : null}
      </section>
    );
  }

  if (matchCount == null) return null;

  return (
    <section className="social-panel space-y-2 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-brand-900 dark:text-foreground">
        {matchCount > 0
          ? t('commerce.distributionMatchedTitle')
          : t('commerce.distributionNoMatchTitle')}
      </h2>
      <p className="text-sm text-foreground-muted">
        {matchCount > 0
          ? t('commerce.distributionMatchedBody', { count: matchCount })
          : t('commerce.distributionNoMatchBody')}
      </p>
    </section>
  );
}

const BADGE_I18N: Record<string, string> = {
  LOWEST_PRICE: 'offer.badgeLowestPrice',
  FASTEST_DELIVERY: 'offer.badgeFastestDelivery',
  HIGHEST_RATED: 'offer.badgeHighestRated',
  CLOSEST_SELLER: 'offer.badgeClosest',
  VERIFIED_BUSINESS: 'offer.badgeVerified',
  BEST_WARRANTY: 'offer.badgeBestWarranty',
  RESPONSE_QUALITY: 'offer.badgeResponseQuality',
};

function OfferBadges({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <li
          key={badge}
          className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100"
        >
          {t(BADGE_I18N[badge] ?? badge)}
        </li>
      ))}
    </ul>
  );
}
