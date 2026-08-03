'use client';

import { EmptyState, ErrorState, Skeleton } from '@ustapilot/ui';
import Link from 'next/link';

import { t } from '@/lib/i18n';

import { CategoryIcon } from './category-icon';
import { useCategories } from './use-categories';

export interface CategoryGridProps {
  /** Ana sayfada yalnızca ilk N kategori gösterilir. */
  limit?: number;
}

export function CategoryGrid({ limit }: CategoryGridProps) {
  const { data, isPending, isError, refetch } = useCategories();

  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden>
        {Array.from({ length: limit ?? 10 }, (_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
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

  if (data.length === 0) {
    return <EmptyState title={t('status.empty')} />;
  }

  const categories = limit ? data.slice(0, limit) : data;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            href={`/kategoriler/${category.slug}`}
            className="flex h-full flex-col gap-3 rounded-[--radius-card] border border-border bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-surface-muted"
          >
            <span className="grid size-10 place-items-center rounded-[--radius-control] bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-200">
              <CategoryIcon iconKey={category.iconKey} className="size-5" />
            </span>
            <span className="text-sm font-medium text-balance-safe">{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
