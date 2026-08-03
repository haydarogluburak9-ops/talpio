'use client';

import type { Paginated } from '@ustapilot/api-client';
import type { Review } from '@ustapilot/types';
import { Button, EmptyState, ErrorState, ListSkeleton } from '@ustapilot/ui';

import { t } from '@/lib/i18n';

import { ReviewCard } from './review-card';

export interface ReviewListProps {
  page: Paginated<Review> | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  emptyTitle: string;
  emptyDescription: string;
  replyable?: boolean;
}

/**
 * Sayfalı değerlendirme listesi.
 *
 * Sonsuz kaydırma yerine sayfa düğmeleri kullanılır: yorumlar usta profilinde
 * derin gezilen bir içerik değil, karar vermeye yeten bir örneklemdir.
 */
export function ReviewList({
  page,
  isPending,
  isError,
  onRetry,
  onPageChange,
  emptyTitle,
  emptyDescription,
  replyable = false,
}: ReviewListProps) {
  if (isPending) return <ListSkeleton rows={3} />;

  if (isError || !page) {
    return (
      <ErrorState
        title={t('status.errorTitle')}
        description={t('review.loadFailed')}
        action={{ label: t('common.retry'), onClick: onRetry }}
      />
    );
  }

  if (page.items.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {page.items.map((review) => (
          <li key={review.id}>
            <ReviewCard review={review} replyable={replyable} />
          </li>
        ))}
      </ul>

      {page.meta.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={!page.meta.hasPreviousPage}
            onClick={() => onPageChange(page.meta.page - 1)}
          >
            {t('common.back')}
          </Button>
          <span className="text-sm text-foreground-muted">
            {page.meta.page} / {page.meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!page.meta.hasNextPage}
            onClick={() => onPageChange(page.meta.page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
