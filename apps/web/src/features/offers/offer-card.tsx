'use client';

import { OFFER_STATUS_TONES } from '@talpio/config';
import { formatDate, formatMoney, formatRelativeTime, offerStatusLabel } from '@talpio/localization';
import { OfferPriceType, OfferStatus, type Offer } from '@talpio/types';
import { Badge, Button, Card, CardContent, StatusPill } from '@talpio/ui';
import { useState } from 'react';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';
import { useNow } from '@/lib/use-now';

const PRICE_TYPE_LABELS: Record<OfferPriceType, string> = {
  [OfferPriceType.FIXED]: 'Sabit fiyat',
  [OfferPriceType.STARTING_FROM]: 'Başlangıç fiyatı',
  [OfferPriceType.AFTER_INSPECTION]: 'Keşif sonrası netleşir',
  [OfferPriceType.HOURLY]: 'Saatlik',
};

export interface OfferCardProps {
  offer: Offer;
  /** Karar düğmeleri yalnızca talep hâlâ teklife açıkken gösterilir. */
  decidable: boolean;
  onAccept: (offerId: string) => void;
  onReject: (offerId: string) => void;
  isDeciding: boolean;
  badges?: string[];
}

export function OfferCard({
  offer,
  decidable,
  onAccept,
  onReject,
  isDeciding,
  badges = [],
}: OfferCardProps) {
  const locale = publicEnv.defaultLocale;
  const [confirmingAccept, setConfirmingAccept] = useState(false);

  const now = useNow();
  const provider = offer.provider;
  const isExpired = new Date(offer.validUntil).getTime() <= now;
  const canDecide = decidable && offer.status === OfferStatus.SUBMITTED && !isExpired;

  return (
    <Card className={offer.status === OfferStatus.ACCEPTED ? 'border-success-500/40' : undefined}>
      <CardContent className="flex flex-col gap-4 pt-5 sm:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{provider?.displayName ?? 'Satıcı'}</p>
            <p className="text-sm text-foreground-muted">
              {provider?.averageRating != null
                ? `${provider.averageRating.toFixed(1)} puan · ${provider.reviewCount} değerlendirme`
                : 'Henüz değerlendirilmemiş'}
              {provider ? ` · ${provider.completedJobCount} tamamlanan iş` : ''}
            </p>
          </div>
          <StatusPill
            label={offerStatusLabel(offer.status, locale)}
            tone={OFFER_STATUS_TONES[offer.status]}
          />
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-xl font-semibold text-foreground">{formatMoney(offer.price, locale)}</p>
          <span className="text-sm text-foreground-muted">{PRICE_TYPE_LABELS[offer.priceType]}</span>
        </div>

        {offer.note ? (
          <p className="whitespace-pre-line text-sm text-foreground">{offer.note}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
          {provider?.isVerified ? <Badge tone="success">Doğrulanmış</Badge> : null}
          {publicEnv.featurePremium && provider?.isPremium ? (
            <Badge tone="accent">Öncelikli satıcı</Badge>
          ) : null}
          {offer.materialsIncluded ? <Badge tone="info">{t('job.materialsIncluded')}</Badge> : null}
          {offer.estimatedDurationMinutes ? (
            <Badge tone="neutral">{formatDuration(offer.estimatedDurationMinutes)}</Badge>
          ) : null}
          {offer.availableFrom ? (
            <Badge tone="neutral">En erken {formatDate(offer.availableFrom, locale)}</Badge>
          ) : null}
          {badges.map((badge) => (
            <Badge key={badge} tone="accent">
              {comparisonBadgeLabel(badge)}
            </Badge>
          ))}
          <span className="ml-auto">{formatRelativeTime(offer.createdAt, locale)}</span>
        </div>

        <p className="text-xs text-foreground-muted">
          {isExpired
            ? 'Bu teklifin geçerlilik süresi doldu.'
            : `Geçerlilik: ${formatDate(offer.validUntil, locale)}`}
        </p>

        {canDecide ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            {confirmingAccept ? (
              <>
                <p className="text-sm text-foreground">
                  Bu teklifi kabul ederseniz diğer teklifler kapanır ve açık adresiniz bu satıcıyla
                  paylaşılır.
                </p>
                <Button size="sm" isLoading={isDeciding} onClick={() => onAccept(offer.id)}>
                  Evet, kabul et
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmingAccept(false)}>
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => setConfirmingAccept(true)}>
                  {t('offer.accept')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeciding}
                  onClick={() => onReject(offer.id)}
                >
                  {t('offer.reject')}
                </Button>
              </>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} dk`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest === 0 ? `${hours} saat` : `${hours} sa ${rest} dk`;

  return `${Math.round(hours / 24)} gün`;
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

function comparisonBadgeLabel(badge: string): string {
  const key = BADGE_I18N[badge];
  return key ? t(key) : badge;
}
