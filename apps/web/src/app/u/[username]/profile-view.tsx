'use client';

import { EmptyState, ErrorState, ListSkeleton, cn } from '@talpio/ui';
import type { SocialPost, SocialProfile } from '@talpio/types';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { CommerceHub } from '@/features/requests/commerce-hub';
import { ReviewList } from '@/features/reviews/review-list';
import { useProviderReviews } from '@/features/reviews/use-reviews';
import { DiscoverGrid } from '@/features/social/discover-grid';
import { DiscoverViewer } from '@/features/social/discover-viewer';
import { ProfileGraphList } from '@/features/social/profile-graph-list';
import { ProfileHighlightsSection } from '@/features/social/profile-highlights';
import { ProfileHeader } from '@/features/social/profile-header';
import { ProfileSidebar } from '@/features/social/profile-career-section';
import { SocialShell } from '@/features/social/social-shell';
import {
  useFollowers,
  useFollowingList,
  useProfilePosts,
  useSavedPosts,
  useSocialMe,
  useSocialProfile,
} from '@/features/social/use-social';
import { t } from '@/lib/i18n';

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
  | 'commerce';

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
      <SocialShell showRail={false} wide>
        <ListSkeleton rows={3} />
      </SocialShell>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <SocialShell showRail={false} wide>
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
  // Ticaret ve kaydedilenler yalnızca profil sahibinindir; başkasının
  // taleplerini ve aldığı teklifleri kimse göremez.
  const ownTabs: { id: ProfileTab; label: string }[] = isOwn
    ? [
        { id: 'commerce', label: t('commerce.hubTitle') },
        { id: 'saved', label: t('nav.saved') },
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

  const isPersonal = profile.data.kind === 'PERSONAL';

  return (
    <SocialShell showRail={false} wide>
      <div
        className={cn(
          'grid items-start gap-4',
          isPersonal && 'md:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]',
        )}
      >
        {isPersonal ? (
          <aside className="md:sticky md:top-20">
            <ProfileSidebar profile={profile.data} isOwn={isOwn} />
          </aside>
        ) : null}

        <div className="min-w-0">
          <div className="social-panel mb-3 overflow-hidden p-4">
            <ProfileHeader
              profile={profile.data}
              isOwn={isOwn}
              onOpenPosts={() => setTab('posts')}
              onOpenFollowers={() => setTab('followers')}
              onOpenFollowing={() => setTab('following')}
            />
            <ProfileHighlightsSection profile={profile.data} isOwn={isOwn} />
          </div>

          {tabs.length > 0 ? (
            <div className="social-panel mb-3 overflow-x-auto p-1.5">
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
                        'rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors',
                        active
                          ? 'profile-tab-active text-accent-700 dark:text-accent-300'
                          : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <ProfileTabContent
            tab={tab}
            isOwn={isOwn}
            store={store}
            profile={profile.data}
            saved={saved}
            followers={followers}
            following={following}
            posts={posts}
            reviews={reviews}
            providerId={providerId}
          />
        </div>
      </div>
    </SocialShell>
  );
}

function ProfileTabContent({
  tab,
  isOwn,
  store,
  profile,
  saved,
  followers,
  following,
  posts,
  reviews,
  providerId,
}: {
  tab: ProfileTab;
  isOwn: boolean;
  store: SocialProfile['business'];
  profile: SocialProfile;
  saved: ReturnType<typeof useSavedPosts>;
  followers: ReturnType<typeof useFollowers>;
  following: ReturnType<typeof useFollowingList>;
  posts: ReturnType<typeof useProfilePosts>;
  reviews: ReturnType<typeof useProviderReviews>;
  providerId: string;
}) {
  if (tab === 'commerce' && isOwn) {
    return <CommerceHub />;
  }

  if (tab === 'saved' && isOwn) {
    return (
      <PostGrid
        pending={saved.isPending}
        posts={saved.data?.items ?? []}
        emptyTitle={t('social.savedEmpty')}
      />
    );
  }

  if (tab === 'about' && store) {
    return (
      <AboutPanel
        about={store.about ?? profile.bio}
        regions={store.serviceRegions}
        credentials={store.credentials}
      />
    );
  }

  if (tab === 'reviews') {
    return (
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
    );
  }

  if (tab === 'followers') {
    return (
      <ProfileGraphList
        pending={followers.isPending}
        items={followers.data?.items ?? []}
        totalCount={profile.followerCount}
        countLabelKey="social.followersCountLabel"
        searchLabel={t('social.searchFollowers')}
      />
    );
  }

  if (tab === 'following') {
    return (
      <ProfileGraphList
        pending={following.isPending}
        items={following.data?.items ?? []}
        totalCount={profile.followingCount}
        countLabelKey="social.followingCountLabel"
        searchLabel={t('social.searchFollowing')}
        unfollowable={isOwn}
      />
    );
  }

  return (
    <PostGrid
      pending={posts.isPending}
      posts={posts.data?.items ?? []}
      emptyTitle={t('social.feedEmpty')}
    />
  );
}

/** Profil gönderileri; keşfetteki kare ızgara ve tam ekran görüntüleyiciyi kullanır. */
function PostGrid({
  pending,
  posts,
  emptyTitle,
}: {
  pending: boolean;
  posts: SocialPost[];
  emptyTitle: string;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (pending) return <ListSkeleton rows={3} />;

  if (posts.length === 0) {
    return (
      <div className="social-panel px-6 py-10">
        <EmptyState title={emptyTitle} />
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-6">
      <DiscoverGrid posts={posts} onSelect={setViewerIndex} wide />
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
