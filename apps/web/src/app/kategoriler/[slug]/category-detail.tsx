'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@talpio/api-client';
import { ERROR_CODES } from '@talpio/types';
import { Badge, Button, ErrorState, Skeleton } from '@talpio/ui';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { CategoryIcon } from '@/features/catalog/category-icon';
import {
  useCategoryFollows,
  useFollowCategory,
  useUnfollowCategory,
} from '@/features/social/use-social';
import { apiClient } from '@/lib/api';
import { categoryName, t } from '@/lib/i18n';

export function CategoryDetail({ slug }: { slug: string }) {
  const session = useSession();
  const follows = useCategoryFollows(Boolean(session.data));
  const follow = useFollowCategory();
  const unfollow = useUnfollowCategory();
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

  const isFollowing = Boolean(follows.data?.some((item) => item.categoryId === data.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-900 text-accent-400 ring-1 ring-brand-800/40">
          <CategoryIcon iconKey={data.iconKey} className="size-6" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
            {categoryName(data)}
          </h1>
          {data.description ? (
            <p className="text-sm text-foreground-muted text-balance-safe">{data.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {session.data ? (
              <Button
                type="button"
                size="sm"
                variant={isFollowing ? 'outline' : 'primary'}
                disabled={follow.isPending || unfollow.isPending}
                onClick={() =>
                  void (isFollowing
                    ? unfollow.mutateAsync(data.id)
                    : follow.mutateAsync(data.id))
                }
              >
                {isFollowing ? t('social.unfollowCategory') : t('social.followCategory')}
              </Button>
            ) : (
              <Link href="/giris" className="text-sm font-semibold text-accent-600">
                {t('social.loginToInteract')}
              </Link>
            )}
            <Link href="/kesfet" className="text-sm font-semibold text-brand-800">
              {t('social.discoverTitle')} →
            </Link>
          </div>
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
                <Badge tone="brand">{categoryName(subcategory)}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
