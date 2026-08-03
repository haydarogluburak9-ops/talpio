'use client';

import { PAGINATION } from '@ustapilot/config';
import type { ProviderSummary } from '@ustapilot/types';
import { Card, CardContent, CardHeader, CardTitle } from '@ustapilot/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { ReviewList } from './review-list';
import { Stars } from './star-rating';
import { useProviderReviews } from './use-reviews';

export interface ProviderReviewsProps {
  providerId: string;
  /** Ortalama puan usta kartından okunur; liste sayfası puanı yeniden hesaplamaz. */
  summary: Pick<ProviderSummary, 'averageRating' | 'reviewCount'> | undefined;
}

export function ProviderReviews({ providerId, summary }: ProviderReviewsProps) {
  const [page, setPage] = useState(1);
  const reviews = useProviderReviews(providerId, { page, limit: PAGINATION.defaultLimit });

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>{t('review.listTitle')}</CardTitle>
        <RatingSummary summary={summary} />
      </CardHeader>
      <CardContent>
        <ReviewList
          page={reviews.data}
          isPending={reviews.isPending}
          isError={reviews.isError}
          onRetry={() => void reviews.refetch()}
          onPageChange={setPage}
          emptyTitle={t('review.empty')}
          emptyDescription={t('review.emptyDescription')}
        />
      </CardContent>
    </Card>
  );
}

function RatingSummary({ summary }: Pick<ProviderReviewsProps, 'summary'>) {
  // Usta kartı yüklenmediyse puan uydurulmaz; alan boş bırakılır.
  if (!summary) return null;

  if (summary.averageRating === null || summary.averageRating === undefined) {
    return <p className="text-sm text-foreground-muted">{t('review.noRating')}</p>;
  }

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm text-foreground-muted">
      <Stars value={summary.averageRating} />
      <span className="text-base font-semibold text-foreground">
        {summary.averageRating.toFixed(1)}
      </span>
      <span>{t('review.ratingCount', { count: summary.reviewCount })}</span>
    </p>
  );
}
