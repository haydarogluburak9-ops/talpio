'use client';

import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import type { SocialProfile } from '@talpio/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { AccountOverview } from '@/features/auth/account-overview';
import { useSession } from '@/features/auth/use-session';
import { ReviewList } from '@/features/reviews/review-list';
import { useProviderReviews } from '@/features/reviews/use-reviews';
import { PostCard } from '@/features/social/post-card';
import { ProfileHeader } from '@/features/social/profile-header';
import { SocialShell } from '@/features/social/social-shell';
import {
  useFollowers,
  useFollowingList,
  useProfilePosts,
  useSavedPosts,
  useSocialMe,
  useSocialProfile,
} from '@/features/social/use-social';
import { localeTag, t } from '@/lib/i18n';

type ProfileTab =
  | 'posts'
  | 'deals'
  | 'campaigns'
  | 'portfolio'
  | 'reviews'
  | 'about'
  | 'followers'
  | 'following'
  | 'saved'
  | 'settings';

export function SocialProfileView() {
  const params = useParams<{ username: string }>();
  const username = typeof params.username === 'string' ? params.username : '';
  const session = useSession();
  const me = useSocialMe(Boolean(session.data));
  const profile = useSocialProfile(username);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const isStore = profile.data?.kind === 'BUSINESS';
  const isOwn = Boolean(me.data && profile.data && me.data.id === profile.data.id);
  const posts = useProfilePosts(username, tab);
  const saved = useSavedPosts(isOwn && tab === 'saved');
  const followers = useFollowers(username, tab === 'followers');
  const following = useFollowingList(username, tab === 'following');
  const providerId = profile.data?.business?.providerProfileId ?? '';
  const reviews = useProviderReviews(tab === 'reviews' ? providerId : '', { limit: 20 });

  if (profile.isPending) {
    return (
      <SocialShell>
        <ListSkeleton rows={3} />
      </SocialShell>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <SocialShell>
        <div className="social-panel p-4">
          <ErrorState
            title={t('social.profileNotFound')}
            action={{ label: t('common.retry'), onClick: () => void profile.refetch() }}
          />
        </div>
      </SocialShell>
    );
  }

  const store = profile.data.business;
  const ownTabs: { id: ProfileTab; label: string }[] = isOwn
    ? [
        { id: 'saved', label: t('nav.saved') },
        { id: 'settings', label: t('nav.settings') },
      ]
    : [];
  const tabs: { id: ProfileTab; label: string }[] = isStore
    ? [
        { id: 'posts', label: t('social.posts') },
        { id: 'deals', label: t('social.dealsTab') },
        { id: 'campaigns', label: t('social.campaignsTab') },
        { id: 'portfolio', label: t('social.portfolioTab') },
        { id: 'reviews', label: t('social.reviewsTab') },
        { id: 'about', label: t('social.aboutTab') },
        { id: 'followers', label: t('social.followersTab') },
        { id: 'following', label: t('social.followingTab') },
        ...ownTabs,
      ]
    : [
        { id: 'posts', label: t('social.posts') },
        { id: 'followers', label: t('social.followersTab') },
        { id: 'following', label: t('social.followingTab') },
        ...ownTabs,
      ];

  return (
    <SocialShell>
      <div className="social-panel mb-3 overflow-hidden p-4">
        <ProfileHeader
          profile={profile.data}
          onOpenPosts={() => setTab('posts')}
          onOpenFollowers={() => setTab('followers')}
          onOpenFollowing={() => setTab('following')}
        />
      </div>

      {tabs.length > 0 ? (
        <div className="social-panel mb-3 overflow-x-auto px-2 py-1">
          <div className="flex min-w-max gap-1" role="tablist">
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
                    'relative rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                    active
                      ? 'text-accent-600'
                      : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent-500"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === 'settings' && isOwn ? (
        <AccountOverview />
      ) : tab === 'saved' && isOwn ? (
        <div className="flex flex-col gap-3 pb-20">
          {saved.isPending ? (
            <ListSkeleton rows={3} />
          ) : saved.data?.items.length ? (
            saved.data.items.map((post) => (
              <PostCard key={post.id} post={post} interactive />
            ))
          ) : (
            <div className="social-panel px-6 py-10">
              <EmptyState title={t('social.savedEmpty')} />
            </div>
          )}
        </div>
      ) : tab === 'about' && store ? (
        <AboutPanel
          about={store.about ?? profile.data.bio}
          regions={store.serviceRegions}
          credentials={store.credentials}
        />
      ) : tab === 'reviews' ? (
        <div className="social-panel p-4">
          {!providerId ? (
            <EmptyState title={t('social.emptyReviews')} />
          ) : (
            <ReviewList
              page={reviews.data}
              isPending={reviews.isPending}
              isError={reviews.isError}
              onRetry={() => void reviews.refetch()}
              onPageChange={() => undefined}
              emptyTitle={t('social.emptyReviews')}
              emptyDescription={t('social.emptyReviews')}
            />
          )}
        </div>
      ) : tab === 'followers' || tab === 'following' ? (
        <GraphList
          pending={tab === 'followers' ? followers.isPending : following.isPending}
          items={(tab === 'followers' ? followers.data?.items : following.data?.items) ?? []}
        />
      ) : (
        <div className="flex flex-col gap-3 pb-20 lg:pb-6">
          {posts.isPending ? (
            <ListSkeleton rows={3} />
          ) : posts.data?.items.length ? (
            posts.data.items.map((post) => (
              <PostCard key={post.id} post={post} interactive={Boolean(session.data)} />
            ))
          ) : (
            <div className="social-panel px-6 py-10">
              <EmptyState title={t('social.feedEmpty')} />
            </div>
          )}
        </div>
      )}
    </SocialShell>
  );
}

function GraphList({
  pending,
  items,
}: {
  pending: boolean;
  items: SocialProfile[];
}) {
  if (pending) return <ListSkeleton rows={4} />;
  if (items.length === 0) {
    return (
      <div className="social-panel px-6 py-10">
        <EmptyState title={t('social.emptyGraph')} />
      </div>
    );
  }
  return (
    <ul className="social-panel divide-y divide-border">
      {items.map((person) => (
        <li key={person.id}>
          <Link
            href={`/u/${person.username}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
          >
            <span className="grid size-11 place-items-center overflow-hidden rounded-full bg-brand-800 text-xs font-bold text-white">
              {person.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={person.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                person.displayName.slice(0, 1).toLocaleUpperCase(localeTag())
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{person.displayName}</span>
              <span className="block truncate text-xs text-foreground-muted">@{person.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AboutPanel({
  about,
  regions,
  credentials,
}: {
  about?: string | null;
  regions: string[];
  credentials: Array<{ type: string }>;
}) {
  return (
    <div className="social-panel space-y-5 p-5">
      <section>
        <h2 className="text-sm font-semibold text-brand-900 dark:text-foreground">
          {t('social.aboutTab')}
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {about?.trim() || t('social.noAbout')}
        </p>
      </section>
      {regions.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-brand-900 dark:text-foreground">
            {t('social.serviceRegions')}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {regions.map((region) => (
              <li
                key={region}
                className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground-muted"
              >
                {region}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {credentials.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-brand-900 dark:text-foreground">
            {t('social.verifiedCredentials')}
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {credentials.map((item) => (
              <li
                key={item.type}
                className="rounded-lg border border-success-500/30 bg-success-500/10 px-2.5 py-1 text-xs font-medium text-success-700 dark:text-success-400"
              >
                {t(`social.credentialsByType.${item.type}`)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
