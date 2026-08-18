'use client';

import { PAGINATION } from '@talpio/config';
import { Card, CardContent, CardHeader, CardTitle } from '@talpio/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { ReviewList } from './review-list';
import { useMyReviews } from './use-reviews';

/** Satıcının aldığı değerlendirmeler; cevap kutusu her kartın içinde açılır. */
export function ReceivedReviews() {
  const [page, setPage] = useState(1);
  const reviews = useMyReviews({ page, limit: PAGINATION.defaultLimit });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('review.receivedTitle')}</CardTitle>
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
          replyable
        />
      </CardContent>
    </Card>
  );
}
