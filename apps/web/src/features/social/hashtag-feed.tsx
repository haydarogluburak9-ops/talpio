'use client';

import { EmptyState, ErrorState, ListSkeleton } from '@talpio/ui';
import Link from 'next/link';

import { useSession } from '@/features/auth/use-session';
import { t } from '@/lib/i18n';

import { PostCard } from './post-card';
import { useHashtagPosts } from './use-social';

export function HashtagFeed({ slug }: { slug: string }) {
  const session = useSession();
  const posts = useHashtagPosts(slug);

  if (posts.isPending) {
    return <ListSkeleton rows={3} />;
  }

  if (posts.isError) {
    return (
      <div className="social-panel p-4">
        <ErrorState
          title={t('status.errorTitle')}
          description={t('status.errorMessage')}
          action={{ label: t('common.retry'), onClick: () => void posts.refetch() }}
        />
      </div>
    );
  }

  const items = posts.data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="social-panel flex flex-col items-center gap-4 px-6 py-12 text-center">
        <EmptyState title={`#${slug}`} description={t('social.trendingEmpty')} />
        <Link
          href="/kesfet"
          className="inline-flex h-11 items-center rounded-xl bg-accent-500 px-5 text-sm font-semibold text-white hover:bg-accent-600"
        >
          {t('nav.discover')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((post) => (
        <PostCard key={post.id} post={post} interactive={Boolean(session.data)} />
      ))}
    </div>
  );
}
