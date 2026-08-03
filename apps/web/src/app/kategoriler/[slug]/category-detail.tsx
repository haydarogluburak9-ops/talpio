'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@ustapilot/api-client';
import { ERROR_CODES } from '@ustapilot/types';
import { Badge, ErrorState, Skeleton } from '@ustapilot/ui';

import { CategoryIcon } from '@/features/catalog/category-icon';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

export function CategoryDetail({ slug }: { slug: string }) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['catalog', 'category', slug],
    queryFn: ({ signal }) => apiClient.catalog.getCategory(slug, signal),
    staleTime: 10 * 60 * 1000,
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-4" aria-hidden>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    const isMissing = error instanceof ApiError && error.code === ERROR_CODES.NOT_FOUND;

    return (
      <ErrorState
        title={isMissing ? t('status.notFoundTitle') : t('status.errorTitle')}
        description={isMissing ? undefined : t('status.errorMessage')}
        {...(isMissing ? {} : { action: { label: t('common.retry'), onClick: () => void refetch() } })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-[--radius-card] bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-200">
          <CategoryIcon iconKey={data.iconKey} className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.name}</h1>
          {data.description ? (
            <p className="text-sm text-foreground-muted text-balance-safe">{data.description}</p>
          ) : null}
        </div>
      </div>

      {data.subcategories && data.subcategories.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground-muted">
            {t('job.stepCategory')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {data.subcategories.map((subcategory) => (
              <li key={subcategory.id}>
                <Badge tone="brand">{subcategory.name}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
