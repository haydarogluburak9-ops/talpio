import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';
import { REVIEW } from '@talpio/config';
import { formatRelativeTime } from '@talpio/localization';
import type { Review } from '@talpio/types';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { FormField } from '@/components/form-field';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { Stars } from './star-rating';
import { useReplyToReview } from './use-reviews';

/** Kart üzerinde gösterilen alt puanlar; sıra formdaki sırayla aynıdır. */
const RATING_FIELDS = [
  'quality',
  'punctuality',
  'communication',
  'valueForMoney',
  'tidiness',
] as const;

export interface ReviewCardProps {
  review: Review;
  /** Cevap kutusu yalnızca yorumun ilgili satıcısına açılır. */
  replyable?: boolean;
}

export function ReviewCard({ review, replyable = false }: ReviewCardProps) {
  const { t, locale } = useI18n();
  const colors = useColors();

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {review.customer?.displayName ?? '—'}
          </Text>
          <Text variant="caption" tone="muted">
            {formatRelativeTime(review.createdAt, locale)}
          </Text>
        </View>
        <View style={styles.score}>
          <Stars value={review.overallRating} />
          <Text variant="bodyStrong">{review.overallRating.toFixed(1)}</Text>
        </View>
      </View>

      {review.comment ? <Text variant="body">{review.comment}</Text> : null}

      {review.photoUrls.length > 0 ? (
        <View style={styles.photos}>
          {review.photoUrls.map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.photo} />
          ))}
        </View>
      ) : null}

      <View style={styles.breakdown}>
        {RATING_FIELDS.map((name) => (
          <View key={name} style={styles.breakdownRow}>
            <Text variant="caption" tone="muted" style={styles.flex}>
              {t(`review.${name}`)}
            </Text>
            <Text variant="caption">{review.ratings[name]}/5</Text>
          </View>
        ))}
      </View>

      {review.reply ? (
        <View
          style={[
            styles.reply,
            { backgroundColor: colors.surfaceMuted, borderLeftColor: colors.brand },
          ]}
        >
          <Text variant="overline" tone="muted">
            {t('review.replyTitle')}
          </Text>
          <Text variant="caption">{review.reply.body}</Text>
        </View>
      ) : null}

      {replyable ? <ReplyForm review={review} /> : null}
    </Card>
  );
}

function ReplyForm({ review }: { review: Review }) {
  const { t } = useI18n();
  const reply = useReplyToReview();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(review.reply?.body ?? '');

  if (!open) {
    return (
      <Button
        label={review.reply ? t('review.replyUpdate') : t('review.reply')}
        variant="outline"
        size="sm"
        // Kutu her açılışta sunucudaki metinden tazelenir; bileşen listede
        // yeniden kullanıldığı için ilk kurulum değeri bayatlayabilir.
        onPress={() => {
          setBody(review.reply?.body ?? '');
          setOpen(true);
        }}
      />
    );
  }

  return (
    <View style={styles.replyForm}>
      <FormField
        label={t('review.reply')}
        value={body}
        onChangeText={setBody}
        multiline
        numberOfLines={3}
        maxLength={REVIEW.maxReplyLength}
        placeholder={t('review.replyPlaceholder')}
        hint={t('review.replyHint')}
        style={styles.textarea}
      />

      {reply.isError ? (
        <Text variant="caption" tone="danger">
          {reply.error instanceof ApiError ? reply.error.message : t('review.replyFailed')}
        </Text>
      ) : null}

      <Button
        label={reply.isPending ? t('review.replySubmitting') : t('review.replySubmit')}
        size="sm"
        loading={reply.isPending}
        disabled={body.trim().length < 2}
        onPress={() =>
          reply.mutate(
            { reviewId: review.id, body: body.trim() },
            { onSuccess: () => setOpen(false) },
          )
        }
      />
      <Button
        label={t('common.cancel')}
        variant="ghost"
        size="sm"
        onPress={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  flex: { flex: 1 },
  score: { alignItems: 'flex-end', gap: 2 },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 80, height: 80, borderRadius: radius.control },
  breakdown: { gap: 2 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reply: {
    borderLeftWidth: 2,
    borderRadius: radius.control,
    padding: spacing.md,
    gap: spacing.xs,
  },
  replyForm: { gap: spacing.sm },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
});
