'use client';

import { compareOffers } from '@talpio/business-logic';
import { formatMoneyMinor } from '@talpio/localization';
import { Button, ListSkeleton, LoadingState } from '@talpio/ui';
import Link from 'next/link';
import { useMemo } from 'react';

import { useSession } from '@/features/auth/use-session';
import { useShareRequestToFeed } from '@/features/social/use-social';
import { t, getLocale } from '@/lib/i18n';

import {
  useAcceptRequestOffer,
  useCommerceRequest,
  useRequestOffers,
} from './use-requests';

export function RequestDetail({ id }: { id: string }) {
  const session = useSession();
  const request = useCommerceRequest(id);
  const offers = useRequestOffers(id);
  const accept = useAcceptRequestOffer(id);
  const share = useShareRequestToFeed();
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
  const isBuyer = session.data?.id === row.buyerUserId;

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
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-foreground-muted">
                      <th className="py-2 pr-3 font-semibold">{t('commerce.amount')}</th>
                      <th className="py-2 pr-3 font-semibold">{t('commerce.delivery')}</th>
                      <th className="py-2 pr-3 font-semibold">{t('commerce.location')}</th>
                      <th className="py-2 pr-3 font-semibold">{t('commerce.badge')}</th>
                      <th className="py-2 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {(offers.data ?? []).map((offer) => (
                      <tr key={offer.id} className="border-b border-border/60 align-top">
                        <td className="py-3 pr-3 font-semibold text-accent-600">
                          {formatMoneyMinor(
                            offer.amountMinor,
                            offer.currency,
                            getLocale(),
                          )}
                        </td>
                        <td className="py-3 pr-3 text-foreground-muted">
                          {offer.deliveryDays != null ? `${offer.deliveryDays} gün` : '—'}
                          {offer.shippingIncluded != null
                            ? ` · ${
                                offer.shippingIncluded
                                  ? t('social.shippingIncludedYes')
                                  : t('social.shippingIncludedNo')
                              }`
                            : ''}
                        </td>
                        <td className="py-3 pr-3 text-foreground-muted">
                          {offer.locationText ?? '—'}
                        </td>
                        <td className="py-3 pr-3">
                          <OfferBadges
                            badges={[
                              ...(offer.badges ?? []),
                              ...(comparison.badgesByOfferId[offer.id] ?? []),
                            ]}
                          />
                        </td>
                        <td className="py-3 text-right">
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
                            <span className="text-xs text-foreground-muted">{offer.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="flex flex-col gap-3 lg:hidden">
                {(offers.data ?? []).map((offer) => (
                  <li
                    key={offer.id}
                    className="flex flex-col gap-3 rounded-xl bg-surface-muted/60 px-4 py-3 ring-1 ring-border/70"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-accent-600">
                          {formatMoneyMinor(
                            offer.amountMinor,
                            offer.currency,
                            getLocale(),
                          )}
                        </p>
                        <p className="text-sm text-foreground-muted">
                          {offer.status}
                          {offer.deliveryDays != null ? ` · ${offer.deliveryDays} gün` : ''}
                          {offer.locationText ? ` · ${offer.locationText}` : ''}
                          {offer.shippingIncluded != null
                            ? ` · ${
                                offer.shippingIncluded
                                  ? t('social.shippingIncludedYes')
                                  : t('social.shippingIncludedNo')
                              }`
                            : ''}
                        </p>
                      </div>
                      {isBuyer && offer.status === 'SUBMITTED' ? (
                        <Button
                          size="sm"
                          className="bg-accent-500 text-white hover:bg-accent-600"
                          disabled={accept.isPending}
                          onClick={() => accept.mutate(offer.id)}
                        >
                          {t('offer.accept')}
                        </Button>
                      ) : null}
                    </div>
                    <OfferBadges
                      badges={[
                        ...(offer.badges ?? []),
                        ...(comparison.badgesByOfferId[offer.id] ?? []),
                      ]}
                    />
                    {offer.note ? <p className="text-sm">{offer.note}</p> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </div>
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
