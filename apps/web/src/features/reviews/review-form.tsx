'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@talpio/api-client';
import { UPLOAD } from '@talpio/config';
import { FilePurpose } from '@talpio/types';
import { Button, Field, Textarea } from '@talpio/ui';
import { createReviewSchema, type CreateReviewInput } from '@talpio/validation';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';

import { PhotoUploader } from '@/features/files/photo-uploader';
import { t } from '@/lib/i18n';

import { StarRating } from './star-rating';
import { useCreateReview } from './use-reviews';

type CreateReviewPayload = z.output<typeof createReviewSchema>;

/** Formdaki beş alt puan; sıra ekranda göründüğü sıradır. */
const RATING_FIELDS = [
  'quality',
  'punctuality',
  'communication',
  'valueForMoney',
  'tidiness',
] as const;

export interface ReviewFormProps {
  orderId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ orderId, onSubmitted }: ReviewFormProps) {
  const createReview = useCreateReview();

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
    // Üçüncü tip parametresi şemanın çıkışıdır; `handleSubmit` varsayılanları
    // uygulanmış, dönüştürülmüş değerleri verir ve gövde el ile çevrilmez.
  } = useForm<CreateReviewInput, unknown, CreateReviewPayload>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { orderId, photoFileIds: [] },
  });

  const onSubmit = handleSubmit((values) => {
    createReview.mutate(values, { onSuccess: () => onSubmitted?.() });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <p className="text-sm text-foreground-muted">{t('review.formHint')}</p>

      {createReview.isError ? (
        <p
          role="alert"
          className="rounded-[--radius-control] bg-danger-surface p-3 text-sm text-danger-on-surface"
        >
          {createReview.error instanceof ApiError
            ? createReview.error.message
            : t('review.submitFailed')}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {RATING_FIELDS.map((name) => (
          <Controller
            key={name}
            control={control}
            name={`ratings.${name}`}
            render={({ field }) => (
              <StarRating
                id={`rating-${name}`}
                label={t(`review.${name}`)}
                value={field.value}
                onChange={field.onChange}
                // Puanlanmamış alanın şema hatası "sayı bekleniyordu" der; kullanıcıya
                // gösterilecek olan ne yapması gerektiğidir.
                error={errors.ratings?.[name] ? t('review.ratingRequired') : undefined}
              />
            )}
          />
        ))}
      </div>

      <Field
        label={t('review.comment')}
        hint={t('review.commentHint')}
        error={errors.comment?.message}
      >
        {(props) => (
          <Textarea
            {...props}
            {...register('comment', {
              setValueAs: (value: string) => (value.trim() === '' ? undefined : value),
            })}
            rows={4}
            placeholder={t('review.commentPlaceholder')}
          />
        )}
      </Field>

      <Field label={t('review.photos')} hint={t('review.photosHint')}>
        {() => (
          <Controller
            control={control}
            name="photoFileIds"
            render={({ field }) => (
              <PhotoUploader
                value={field.value ?? []}
                onChange={field.onChange}
                purpose={FilePurpose.REVIEW_PHOTO}
                max={UPLOAD.maxReviewPhotos}
              />
            )}
          />
        )}
      </Field>

      <Button type="submit" className="self-start" isLoading={createReview.isPending}>
        {createReview.isPending ? t('review.submitting') : t('review.submit')}
      </Button>
    </form>
  );
}
