'use client';

import { EmptyState, ErrorState, Skeleton } from '@talpio/ui';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { categoryLabel, localeTag, t } from '@/lib/i18n';

import { CategoryIcon } from './category-icon';
import { useCategories } from './use-categories';

export interface CategoryGridProps {
  /** Ana sayfada yalnızca ilk N kategori gösterilir. */
  limit?: number;
  /** Kategori sekmesinde arama kutusu. */
  searchable?: boolean;
  /** `/kategoriler?q=` ile gelen ilk sorgu. */
  initialQuery?: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase(localeTag());
}

export function CategoryGrid({
  limit,
  searchable = false,
  initialQuery = '',
}: CategoryGridProps) {
  const { data, isPending, isError, refetch } = useCategories({
    withSubcategories: searchable,
  });
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = normalize(query);
    const list = needle
      ? data.filter((category) => {
          const haystack = [
            category.name,
            categoryLabel(category.slug, category.name),
            category.description ?? '',
            category.slug,
            ...(category.subcategories ?? []).flatMap((sub) => [sub.name, sub.slug]),
          ]
            .join(' ')
            .toLocaleLowerCase(localeTag());
          return haystack.includes(needle);
        })
      : data;
    return limit ? list.slice(0, limit) : list;
  }, [data, query, limit]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-6">
        {searchable ? (
          <div className="h-12 w-full max-w-xl animate-pulse rounded-xl bg-surface-muted" />
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden>
          {Array.from({ length: limit ?? 10 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t('status.networkErrorTitle')}
        description={t('status.networkErrorMessage')}
        action={{ label: t('common.retry'), onClick: () => void refetch() }}
      />
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={t('status.empty')} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {searchable ? (
        <div className="relative w-full max-w-xl">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <label className="sr-only" htmlFor="category-search">
            {t('catalog.searchCategories')}
          </label>
          <input
            id="category-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('catalog.searchCategoriesPlaceholder')}
            className="h-12 w-full rounded-xl border border-border/80 bg-surface pl-10 pr-11 text-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-brand-300 focus:ring-2 focus:ring-brand-200/60 dark:focus:border-brand-600 dark:focus:ring-brand-800/40"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              aria-label={t('common.close')}
            >
              <X className="size-4" />
            </button>
          ) : null}
          <p className="mt-2 text-xs text-foreground-muted">
            {t('catalog.searchCategoriesCount', { count: filtered.length })}
          </p>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          title={t('catalog.searchCategoriesEmpty')}
          description={t('catalog.searchCategoriesEmptyHint')}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((category) => (
            <li key={category.id}>
              <Link
                href={`/kategoriler/${category.slug}`}
                className="group flex h-full flex-col gap-4 rounded-2xl bg-surface/80 p-5 ring-1 ring-border/80 transition duration-300 hover:-translate-y-1 hover:bg-surface hover:shadow-raised hover:ring-brand-300/70 dark:hover:ring-brand-600"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-900 text-accent-400 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <CategoryIcon iconKey={category.iconKey} className="size-5" />
                </span>
                <span className="font-display text-sm font-semibold tracking-tight text-balance-safe">
                  {categoryLabel(category.slug, category.name)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
