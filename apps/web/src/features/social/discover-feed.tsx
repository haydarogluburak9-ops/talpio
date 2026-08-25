'use client';

import { ApiError } from '@talpio/api-client';
import type { SocialPost } from '@talpio/types';
import { EmptyState, ErrorState, ListSkeleton } from '@talpio/ui';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { TrendingRail } from './trending-rail';
import { SuggestedBusinesses } from './suggested-businesses';
import { DiscoverGrid } from './discover-grid';
import { DiscoverViewer } from './discover-viewer';
import { useDiscoverFeed } from './use-social';

export function DiscoverFeed() {
  const session = useSession();
  const router = useRouter();
  const loggedIn = Boolean(session.data);
  const [query, setQuery] = useState('');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const feed = useDiscoverFeed(loggedIn);

  if (!loggedIn) {
    return (
      <div className="social-panel flex flex-col items-center gap-4 px-6 py-12 text-center">
        <EmptyState title={t('social.discoverTitle')} description={t('social.loginToInteract')} />
        <Link
          href="/giris"
          className="inline-flex h-10 items-center rounded-xl bg-accent-500 px-5 text-sm font-semibold tracking-wide text-white hover:bg-accent-600"
        >
          {t('nav.login')}
        </Link>
      </div>
    );
  }

  const posts = filterPosts(
    (feed.data?.items ?? [])
      .map((item) => item.post)
      .filter((post): post is NonNullable<typeof post> => Boolean(post)),
    query,
  );

  return (
    <div className="flex flex-col gap-3 pb-20 lg:pb-6">
      <form
        className="social-panel p-3 sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const q = query.trim();
          if (q.startsWith('#')) {
            router.push(`/gundem/${encodeURIComponent(q.slice(1).toLocaleLowerCase('en-US'))}`);
          }
        }}
      >
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <span className="sr-only">{t('common.search')}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('social.searchPlaceholder')}
            className="h-11 w-full rounded-xl border border-transparent bg-surface-muted/90 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-foreground-muted focus:border-accent-500/40 focus:bg-surface"
          />
        </label>
      </form>

      <TrendingRail compact />
      <SuggestedBusinesses withIntro />

      <div className="px-0.5">
        <h2 className="font-display text-sm font-semibold text-brand-900 dark:text-foreground">
          {t('social.railDealsTitle')}
        </h2>
        <p className="mt-0.5 text-xs text-foreground-muted">{t('social.discoverSubtitle')}</p>
      </div>

      {feed.isPending ? (
        <ListSkeleton rows={3} />
      ) : feed.isError ? (
        <div className="social-panel p-4">
          <ErrorState
            title={t('status.errorTitle')}
            description={
              feed.error instanceof ApiError ? feed.error.message : t('status.errorMessage')
            }
            action={{ label: t('common.retry'), onClick: () => void feed.refetch() }}
          />
        </div>
      ) : posts.length === 0 ? (
        <div className="social-panel px-6 py-12">
          <EmptyState title={t('social.discoverEmpty')} description={t('social.feedEmptyHint')} />
        </div>
      ) : (
        <DiscoverGrid posts={posts} onSelect={setViewerIndex} />
      )}

      {viewerIndex !== null ? (
        <DiscoverViewer
          posts={posts}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </div>
  );
}

/** Arama kutusu hem metni hem de #etiketleri süzer. */
function filterPosts(posts: SocialPost[], query: string): SocialPost[] {
  const needle = query.trim().replace(/^#/, '').toLocaleLowerCase('en-US');
  if (!needle) return posts;

  return posts.filter((post) =>
    [
      post.body ?? '',
      ...(post.hashtags ?? []),
      post.author?.displayName ?? '',
      post.author?.username ?? '',
      post.deal?.title ?? '',
      post.promo?.label ?? '',
    ]
      .join(' ')
      .toLocaleLowerCase('en-US')
      .includes(needle),
  );
}
