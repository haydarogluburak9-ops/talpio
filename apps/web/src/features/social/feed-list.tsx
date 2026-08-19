'use client';

import { ApiError } from '@talpio/api-client';
import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { useCompose } from './compose-context';
import { PostCard } from './post-card';
import { StoriesRail } from './stories-rail';
import { TrendingRail } from './trending-rail';
import { useSocialFeed } from './use-social';

type FeedTab = 'all' | 'deals' | 'requests' | 'campaigns' | 'following';

const DEALISH = new Set([
  'DEAL',
  'SPECIAL_PRICE',
  'DISCOUNT',
  'BULK_PRICE',
  'LIMITED_STOCK',
  'CLEARANCE',
  'SERVICE_PROMOTION',
  'NEW_PRODUCT',
]);

function feedErrorDescription(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'UNAUTHORIZED' || error.status === 401) {
      return t('social.loginToInteract');
    }
    if (error.code === 'FORBIDDEN' || error.status === 403) {
      return t('social.feedForbidden');
    }
    if (error.status === 404) {
      return t('social.feedApiMissing');
    }
    return error.message || t('status.errorMessage');
  }
  return t('status.errorMessage');
}

export function FeedList() {
  const session = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const compose = searchParams.get('compose');
  const { openCompose } = useCompose();
  const loggedIn = Boolean(session.data);
  const feed = useSocialFeed(loggedIn);
  const [tab, setTab] = useState<FeedTab>('all');

  useEffect(() => {
    if (compose === 'promo' || compose === 'media' || compose === 'story') {
      openCompose(compose);
      router.replace('/akis', { scroll: false });
    }
  }, [compose, openCompose, router]);

  const allPosts = useMemo(() => {
    return (feed.data?.items ?? [])
      .map((item) => item.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post));
  }, [feed.data?.items]);

  const posts = useMemo(() => {
    if (tab === 'campaigns') {
      return allPosts.filter((post) => post.type === 'CAMPAIGN' || post.type === 'B2B_CAMPAIGN');
    }
    if (tab === 'requests') {
      return allPosts.filter((post) => post.type === 'REQUEST_SHARE' || Boolean(post.commerceRequestId));
    }
    if (tab === 'deals') {
      return allPosts.filter(
        (post) => DEALISH.has(post.type) || Boolean(post.deal) || Boolean(post.promo),
      );
    }
    return allPosts;
  }, [allPosts, tab]);

  const tabs: { id: FeedTab; label: string; activeClass: string }[] = [
    { id: 'all', label: t('social.feedTabAll'), activeClass: 'bg-accent-50 text-accent-700' },
    { id: 'deals', label: t('social.feedTabDeals'), activeClass: 'bg-accent-50 text-accent-700' },
    { id: 'requests', label: t('social.feedTabRequests'), activeClass: 'bg-warning-50 text-warning-700' },
    { id: 'campaigns', label: t('social.feedTabCampaigns'), activeClass: 'bg-success-50 text-success-700' },
    { id: 'following', label: t('social.feedTabFollowing'), activeClass: 'bg-info-50 text-info-700' },
  ];

  if (!loggedIn) {
    return (
      <div className="social-panel flex flex-col items-center gap-4 px-6 py-12 text-center">
        <EmptyState title={t('social.feedTitle')} description={t('social.loginToInteract')} />
        <Link
          href="/giris"
          className="inline-flex h-11 items-center rounded-xl bg-accent-500 px-5 text-sm font-semibold text-white hover:bg-accent-600"
        >
          {t('nav.login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 dark:text-foreground">
          {t('social.feedTitle')}
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">{t('social.feedSubtitle')}</p>
      </div>
      <StoriesRail />
      {feed.isPending ? <ListSkeleton rows={3} /> : null}
      {feed.isError ? (
        <div className="social-panel p-4">
          <ErrorState
            title={t('status.errorTitle')}
            description={feedErrorDescription(feed.error)}
            action={{ label: t('common.retry'), onClick: () => void feed.refetch() }}
          />
        </div>
      ) : null}
      {feed.isPending || feed.isError ? null : (
        <>
          <div className="xl:hidden">
            <TrendingRail compact />
          </div>

          <div className="social-panel overflow-x-auto px-2 py-1">
            <div className="flex min-w-max gap-1" role="tablist" aria-label={t('social.feedTitle')}>
              {tabs.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(item.id)}
                    className={cn(
                      'rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                      active
                        ? item.activeClass
                        : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="social-panel flex flex-col items-center gap-4 px-6 py-12 text-center">
              <EmptyState title={t('social.feedEmpty')} description={t('social.feedEmptyHint')} />
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/kesfet"
                  className="inline-flex h-11 items-center rounded-xl bg-accent-500 px-5 text-sm font-semibold text-white hover:bg-accent-600"
                >
                  {t('nav.discover')}
                </Link>
                <Link
                  href="/tedarik"
                  className="inline-flex h-11 items-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  {t('nav.newRequest')}
                </Link>
              </div>
            </div>
          ) : (
            posts.map((post, index) => (
              <div
                key={post.id}
                className="social-feed-item"
                style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
              >
                <PostCard post={post} interactive />
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
