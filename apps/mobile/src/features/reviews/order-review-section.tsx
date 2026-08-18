import { useRouter } from 'expo-router';

import { OrderStatus, type Order } from '@talpio/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';

import { ReviewCard } from './review-card';
import { useReviewForOrder } from './use-reviews';

/**
 * Sipariş detayındaki değerlendirme bölümü.
 *
 * İş onaylanmadan önce değerlendirme diye bir kavram yoktur; bu yüzden bölüm
 * yalnızca tamamlanmış siparişlerde belirir.
 */
export function OrderReviewSection({
  order,
  isProvider,
}: {
  order: Order;
  /** Satıcı yalnızca yazılmış yorumu ve cevabını görür; puanlama müşterinindir. */
  isProvider: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();

  const completed = order.status === OrderStatus.COMPLETED;
  const review = useReviewForOrder(order.id, completed);

  if (!completed) return null;

  return (
    <Card>
      <Text variant="bodyStrong">{t('review.listTitle')}</Text>

      {review.isPending ? <ListSkeleton rows={1} /> : null}

      {review.isError ? (
        <Text variant="caption" tone="danger">
          {t('review.loadFailed')}
        </Text>
      ) : null}

      {review.data ? <ReviewCard review={review.data} replyable={isProvider} /> : null}

      {review.isSuccess && review.data === null ? (
        isProvider ? (
          <Text variant="caption" tone="muted">
            {t('review.emptyDescription')}
          </Text>
        ) : (
          <>
            <Text variant="caption" tone="muted">
              {t('review.pendingDescription')}
            </Text>
            <Button
              label={t('review.createTitle')}
              onPress={() => router.push(`/customer/orders/${order.id}/review`)}
            />
          </>
        )
      ) : null}
    </Card>
  );
}
