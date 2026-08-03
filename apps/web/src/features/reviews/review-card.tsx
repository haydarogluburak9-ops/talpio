'use client';

import { ApiError } from '@ustapilot/api-client';
import { REVIEW } from '@ustapilot/config';
import { formatRelativeTime } from '@ustapilot/localization';
import type { Review } from '@ustapilot/types';
import { Button, Card, CardContent, Textarea } from '@ustapilot/ui';
import { useState } from 'react';

import { publicEnv } from '@/lib/env';
import { t } from '@/lib/i18n';

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
  /** Cevap kutusu yalnızca yorumun ilgili ustasına açılır. */
  replyable?: boolean;
}

export function ReviewCard({ review, replyable = false }: ReviewCardProps) {
  const locale = publicEnv.defaultLocale;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-5 sm:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{review.customer?.displayName ?? '—'}</p>
            <p className="text-sm text-foreground-muted">
              {formatRelativeTime(review.createdAt, locale)}
            </p>
          </div>
          <span className="flex items-center gap-2">
            <Stars value={review.overallRating} />
            <span className="text-sm font-semibold text-foreground">
              {review.overallRating.toFixed(1)}
            </span>
          </span>
        </div>

        {review.comment ? (
          <p className="whitespace-pre-line text-sm text-foreground">{review.comment}</p>
        ) : null}

        {review.photoUrls.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {review.photoUrls.map((url) => (
              <li key={url}>
                {/* Görseller nesne deposundan gelir; Next optimizasyonu ayrı yapılandırma
                    gerektirdiğinden düz `img` kullanılır. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="size-20 rounded-[--radius-control] border border-border object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="grid gap-x-6 gap-y-1 text-xs text-foreground-muted sm:grid-cols-2">
          {RATING_FIELDS.map((name) => (
            <div key={name} className="flex items-center justify-between gap-3">
              <dt>{t(`review.${name}`)}</dt>
              <dd className="font-medium text-foreground">{review.ratings[name]}/5</dd>
            </div>
          ))}
        </dl>

        {review.reply ? (
          <div className="rounded-[--radius-control] border-l-2 border-brand-600 bg-surface-muted p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
              {t('review.replyTitle')}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-foreground">{review.reply.body}</p>
          </div>
        ) : null}

        {replyable ? <ReplyForm review={review} /> : null}
      </CardContent>
    </Card>
  );
}

function ReplyForm({ review }: { review: Review }) {
  const reply = useReplyToReview();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(review.reply?.body ?? '');

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        // Kutu her açılışta sunucudaki metinden tazelenir; bileşen listede
        // yeniden kullanıldığı için ilk kurulum değeri bayatlayabilir.
        onClick={() => {
          setBody(review.reply?.body ?? '');
          setOpen(true);
        }}
      >
        {review.reply ? t('review.replyUpdate') : t('review.reply')}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <label className="text-sm font-medium text-foreground" htmlFor={`reply-${review.id}`}>
        {t('review.reply')}
      </label>
      <Textarea
        id={`reply-${review.id}`}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
        maxLength={REVIEW.maxReplyLength}
        placeholder={t('review.replyPlaceholder')}
      />
      <p className="text-xs text-foreground-muted">{t('review.replyHint')}</p>

      {reply.isError ? (
        <p role="alert" className="text-sm text-danger-on-surface">
          {reply.error instanceof ApiError ? reply.error.message : t('review.replyFailed')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          isLoading={reply.isPending}
          disabled={body.trim().length < 2}
          onClick={() =>
            reply.mutate(
              { reviewId: review.id, body: body.trim() },
              { onSuccess: () => setOpen(false) },
            )
          }
        >
          {reply.isPending ? t('review.replySubmitting') : t('review.replySubmit')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  );
}
