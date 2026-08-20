'use client';

import { cn } from '@talpio/ui';
import { Check } from 'lucide-react';

import { CategoryIcon } from '@/features/catalog/category-icon';
import { useCategories } from '@/features/catalog/use-categories';
import { categoryLabel, t } from '@/lib/i18n';

import { MIN_INTERESTS } from '@/lib/interest-onboarding';
const MAX_INTERESTS = 12;

export function InterestPicker({
  selected,
  onChange,
  error,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const categories = useCategories();
  const chosen = new Set(selected);
  const items = categories.data ?? [];
  const ready = selected.length >= MIN_INTERESTS;
  const progress = Math.min(100, (selected.length / MIN_INTERESTS) * 100);

  function toggle(id: string) {
    if (chosen.has(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    if (selected.length >= MAX_INTERESTS) return;
    onChange([...selected, id]);
  }

  return (
    <fieldset className="overflow-hidden rounded-[1.5rem] border border-brand-900/8 bg-gradient-to-b from-brand-50/90 via-surface to-surface dark:border-white/8 dark:from-brand-950/70 dark:via-surface dark:to-surface">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <legend className="font-display text-base font-semibold tracking-tight text-brand-900 dark:text-foreground">
              {t('auth.interestsTitle')}
            </legend>
            <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{t('auth.interestsHint')}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
              ready
                ? 'bg-brand-900 text-white'
                : 'bg-surface-muted text-foreground-muted ring-1 ring-border',
            )}
          >
            {selected.length}/{MIN_INTERESTS}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-800">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              ready ? 'bg-accent-500' : 'bg-gradient-to-r from-brand-700 to-accent-400',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {categories.isPending ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[6.5rem] animate-pulse rounded-2xl bg-surface-muted" />
            ))}
          </div>
        ) : null}

        {categories.isError ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-danger-surface p-4">
            <p className="text-sm text-danger-on-surface">{t('auth.interestsLoadError')}</p>
            <button
              type="button"
              onClick={() => void categories.refetch()}
              className="self-start text-sm font-semibold text-accent-600 hover:underline"
            >
              {t('common.retry')}
            </button>
          </div>
        ) : null}

        {!categories.isPending && !categories.isError && items.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted px-4 py-6 text-center text-sm text-foreground-muted">
            {t('auth.interestsEmpty')}
          </p>
        ) : null}

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {items.map((category) => {
              const active = chosen.has(category.id);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggle(category.id)}
                  aria-pressed={active}
                  className={cn(
                    'group relative flex min-h-[6.5rem] flex-col items-start gap-3 rounded-2xl p-3.5 text-left transition duration-200',
                    active
                      ? 'bg-brand-900 text-white shadow-raised ring-2 ring-accent-500'
                      : 'bg-white ring-1 ring-border/80 hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-300/80 dark:bg-surface-muted dark:hover:ring-brand-500',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 place-items-center rounded-xl transition-colors',
                      active ? 'bg-accent-500 text-white' : 'bg-brand-900 text-accent-400',
                    )}
                  >
                    <CategoryIcon iconKey={category.iconKey} className="size-4" />
                  </span>
                  <span className="font-display text-[13px] font-semibold leading-snug tracking-tight text-balance-safe">
                    {categoryLabel(category.slug, category.name)}
                  </span>
                  {active ? (
                    <span className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-accent-500 text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}

        <p className={cn('text-xs', ready ? 'font-medium text-brand-700 dark:text-brand-200' : 'text-foreground-muted')}>
          {ready
            ? t('auth.interestsReady')
            : t('auth.interestsCount', { count: selected.length, min: MIN_INTERESTS })}
        </p>
        {error ? (
          <p role="alert" className="text-xs font-medium text-danger-500">
            {error}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
