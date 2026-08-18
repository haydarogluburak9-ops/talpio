'use client';

import { OrderStatus, type Order } from '@talpio/types';
import { Button, Card, CardContent, CardHeader, CardTitle, ListSkeleton } from '@talpio/ui';
import { useState } from 'react';

import { t } from '@/lib/i18n';

import { ReviewCard } from './review-card';
import { ReviewForm } from './review-form';
import { useReviewForOrder } from './use-reviews';

export interface OrderReviewSectionProps {
  order: Order;
  /** Satıcı yalnızca yazılmış yorumu ve cevabını görür; puanlama müşterinindir. */
  isProvider: boolean;
}

/**
 * Sipariş detayındaki değerlendirme bölümü.
 *
 * İş onaylanmadan önce değerlendirme diye bir kavram yoktur; bu yüzden bölüm
 * yalnızca tamamlanmış siparişlerde belirir.
 */
export function OrderReviewSection({ order, isProvider }: OrderReviewSectionProps) {
  const completed = order.status === OrderStatus.COMPLETED;
  const review = useReviewForOrder(order.id, completed);
  const [formOpen, setFormOpen] = useState(false);

  if (!completed) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('review.listTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {review.isPending ? <ListSkeleton rows={1} /> : null}

        {review.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            {t('review.loadFailed')}{' '}
            <button type="button" onClick={() => void review.refetch()} className="underline">
              {t('common.retry')}
            </button>
          </p>
        ) : null}

        {review.data ? (
          <ReviewCard review={review.data} replyable={isProvider} />
        ) : null}

        {review.isSuccess && review.data === null && isProvider ? (
          <p className="text-sm text-foreground-muted">{t('review.emptyDescription')}</p>
        ) : null}

        {review.isSuccess && review.data === null && !isProvider ? (
          formOpen ? (
            <ReviewForm orderId={order.id} onSubmitted={() => setFormOpen(false)} />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-foreground-muted">{t('review.pendingDescription')}</p>
              <Button className="self-start" onClick={() => setFormOpen(true)}>
                {t('review.createTitle')}
              </Button>
            </div>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
