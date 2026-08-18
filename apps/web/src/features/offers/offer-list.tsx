'use client';

import { OfferSortKey, compareOffers, sortOffers, type SortableOffer } from '@talpio/business-logic';
import { OfferStatus, type Offer } from '@talpio/types';
import { Button, EmptyState, ErrorState, ListSkeleton } from '@talpio/ui';
import { useMemo, useState } from 'react';

import { t } from '@/lib/i18n';

import { OfferCard } from './offer-card';
import { useAcceptOffer, useJobOffers, useRejectOffer } from './use-offers';

/**
 * "Önerilen" sıralama satıcının iptal oranı ve son etkinlik bilgisine dayanır;
 * bunlar teklif gövdesindeki satıcı özetinde taşınmadığı için burada sunulmaz.
 * Aşağıdaki anahtarların hepsi teklifin kendi alanlarından hesaplanabilir.
 */
const SORT_OPTIONS = [
  { id: OfferSortKey.PRICE_ASC, labelKey: 'offer.badgeLowestPrice' },
  { id: OfferSortKey.RATING_DESC, labelKey: 'offer.badgeHighestRated' },
  { id: OfferSortKey.FASTEST, labelKey: 'offer.badgeFastestDelivery' },
  { id: OfferSortKey.NEWEST, labelKey: 'offer.sortNewest' },
] as const;

/** Tek sayfada gösterilen teklif sayısı. Sıralama bu küme üzerinde yapılır. */
const PAGE_SIZE = 50;

export function OfferList({ jobId, decidable }: { jobId: string; decidable: boolean }) {
  const [sortKey, setSortKey] = useState<OfferSortKey>(OfferSortKey.PRICE_ASC);
  const offers = useJobOffers(jobId, { limit: PAGE_SIZE });
  const acceptOffer = useAcceptOffer(jobId);
  const rejectOffer = useRejectOffer(jobId);

  // Sorgu verisi doğrudan kullanılır; her render'da yeni bir dizi türetmek
  // useMemo'yu işlevsiz bırakırdı.
  const items = offers.data?.items;
  const sorted = useMemo(() => sortForDisplay(items ?? [], sortKey), [items, sortKey]);
  const badgesById = useMemo(() => {
    const comparison = compareOffers(
      (items ?? []).map((offer) => ({
        id: offer.id,
        amountMinor: offer.price.amountMinor,
        estimatedDurationMinutes: offer.estimatedDurationMinutes ?? null,
        averageRating: offer.provider?.averageRating ?? null,
        verified: offer.provider?.isVerified ?? false,
        noteLength: offer.note?.length ?? 0,
        responseMinutes: offer.provider?.averageResponseMinutes ?? null,
      })),
    );
    return comparison.badgesByOfferId;
  }, [items]);

  if (offers.isError) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description="Teklifler yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin."
        action={{ label: t('common.retry'), onClick: () => void offers.refetch() }}
      />
    );
  }

  if (offers.isPending) return <ListSkeleton rows={2} />;

  if (sorted.length === 0) {
    return (
      <EmptyState
        title={t('job.noOffers')}
        description="Talebiniz satıcılara gösteriliyor. Teklif geldiğinde burada listelenir."
      />
    );
  }

  const isDeciding = acceptOffer.isPending || rejectOffer.isPending;
  const total = offers.data?.meta.total ?? sorted.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {SORT_OPTIONS.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={sortKey === option.id ? 'primary' : 'outline'}
            aria-pressed={sortKey === option.id}
            onClick={() => setSortKey(option.id)}
          >
            {t(option.labelKey)}
          </Button>
        ))}
      </div>

      {acceptOffer.isError || rejectOffer.isError ? (
        <p role="alert" className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface">
          İşlem tamamlanamadı. Teklif geri çekilmiş veya süresi dolmuş olabilir.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {sorted.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            decidable={decidable}
            isDeciding={isDeciding}
            badges={badgesById[offer.id] ?? []}
            onAccept={(offerId) => acceptOffer.mutate({ offerId })}
            onReject={(offerId) => rejectOffer.mutate({ offerId })}
          />
        ))}
      </div>

      {total > sorted.length ? (
        <p className="text-sm text-foreground-muted">
          {total} teklifin ilk {sorted.length} tanesi gösteriliyor.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Bekleyen teklifler daima üstte kalır: kapanmış bir teklif fiyatı düşük diye
 * listenin başına geçerse müşteri karar verilecek teklifi kaçırır.
 */
function sortForDisplay(offers: Offer[], sortKey: OfferSortKey): Offer[] {
  const pending = offers.filter((offer) => offer.status === OfferStatus.SUBMITTED);
  const rest = offers.filter((offer) => offer.status !== OfferStatus.SUBMITTED);

  return [...sortByKey(pending, sortKey), ...sortByKey(rest, sortKey)];
}

function sortByKey(offers: Offer[], sortKey: OfferSortKey): Offer[] {
  const sortable = offers.map(toSortable);
  return sortOffers(sortable, sortKey).map((item) => item.offer);
}

type OfferWithSource = SortableOffer & { offer: Offer };

function toSortable(offer: Offer): OfferWithSource {
  const provider = offer.provider;

  return {
    offer,
    id: offer.id,
    amountMinor: offer.price.amountMinor,
    estimatedDurationMinutes: offer.estimatedDurationMinutes ?? null,
    createdAt: offer.createdAt,
    provider: {
      providerProfileId: offer.providerProfileId,
      averageRating: provider?.averageRating ?? null,
      reviewCount: provider?.reviewCount ?? 0,
      completedJobCount: provider?.completedJobCount ?? 0,
      averageResponseMinutes: provider?.averageResponseMinutes ?? null,
      // Yalnızca "önerilen" sıralamasında okunur; o sıralama sunulmadığı için
      // burada nötr değerler yeterlidir.
      cancellationRate: 0,
      isVerified: provider?.isVerified ?? false,
      isPremium: provider?.isPremium ?? false,
      lastActiveAt: null,
    },
  };
}
