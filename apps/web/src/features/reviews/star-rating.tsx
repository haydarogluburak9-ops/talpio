'use client';

import { REVIEW } from '@ustapilot/config';
import { cn } from '@ustapilot/ui';

import { t } from '@/lib/i18n';

const STARS = Array.from(
  { length: REVIEW.maxRating - REVIEW.minRating + 1 },
  (_, index) => REVIEW.minRating + index,
);

/** Yıldız karşılıkları katalogda `review.star1`…`review.star5` olarak durur. */
export function starDescription(value: number): string {
  return t(`review.star${value}`);
}

export interface StarRatingProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  id?: string;
  describedBy?: string;
}

/**
 * Puanlama alanı.
 *
 * Radio grubu olarak kurulur: klavyeyle gezilebilir ve ekran okuyucu her
 * yıldızın kaç puana karşılık geldiğini okur. Görsel yıldızlar `aria-hidden`
 * değildir; etiket metni erişilebilir isim olarak taşınır.
 */
export function StarRating({ label, value, onChange, error, id, describedBy }: StarRatingProps) {
  const errorId = error && id ? `${id}-error` : undefined;
  const description = value ? starDescription(value) : null;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={[errorId, describedBy].filter(Boolean).join(' ') || undefined}
        className="flex flex-wrap items-center gap-3"
      >
        <span className="min-w-40 text-sm font-medium text-foreground">{label}</span>

        <span className="flex items-center gap-1">
          {STARS.map((star) => {
            const selected = value === star;

            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={t('review.starLabel', { count: star })}
                onClick={() => onChange(star)}
                className={cn(
                  'rounded-[--radius-control] px-0.5 text-2xl leading-none transition-colors',
                  value !== undefined && star <= value
                    ? 'text-warning-500'
                    : 'text-border hover:text-warning-500/60',
                )}
              >
                ★
              </button>
            );
          })}
        </span>

        {description ? (
          <span className="text-sm text-foreground-muted">{description}</span>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface StarsProps {
  value: number;
  className?: string;
}

/** Salt okunur yıldız gösterimi. Yarım puanlar en yakın tam yıldıza yuvarlanır. */
export function Stars({ value, className }: StarsProps) {
  const filled = Math.round(value);

  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-base leading-none', className)}
      aria-label={t('review.starLabel', { count: value.toFixed(1) })}
    >
      {STARS.map((star) => (
        <span
          key={star}
          aria-hidden
          className={star <= filled ? 'text-warning-500' : 'text-border'}
        >
          ★
        </span>
      ))}
    </span>
  );
}
