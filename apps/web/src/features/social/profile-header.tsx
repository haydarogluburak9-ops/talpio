'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, SOCIAL } from '@talpio/config';
import type { SocialProfile } from '@talpio/types';
import { SocialProfileKind } from '@talpio/types';
import { Button, cn } from '@talpio/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { apiClient } from '@/lib/api';
import { localeTag, t } from '@/lib/i18n';

import { ReportDialog } from './report-dialog';
import { ProfileAvatarEditor, ProfileCoverEditor } from './profile-media-editor';
import { useFollow, useMessageProfile, useSocialMe, useUnfollow, useUpdateSocialProfile } from './use-social';

export function ProfileHeader({
  profile,
  isOwn = false,
  onOpenFollowers,
  onOpenFollowing,
  onOpenPosts,
}: {
  profile: SocialProfile;
  isOwn?: boolean;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  onOpenPosts?: () => void;
}) {
  const router = useRouter();
  const session = useSession();
  const me = useSocialMe(Boolean(session.data));
  const follow = useFollow(profile.username);
  const unfollow = useUnfollow(profile.username);
  const message = useMessageProfile(profile.username);
  const isOwnProfile = isOwn || me.data?.id === profile.id;
  const [reportOpen, setReportOpen] = useState(false);
  const store = profile.kind === 'BUSINESS' ? profile.business : null;

  const followingCheck = useQuery({
    queryKey: queryKeys.social.following(me.data?.username ?? '', { target: profile.id }),
    queryFn: ({ signal }) =>
      apiClient.social.listFollowing(me.data!.username, { limit: 100 }, signal),
    enabled: Boolean(me.data && !isOwnProfile),
  });

  const isFollowing =
    Boolean(profile.isFollowing) ||
    Boolean(followingCheck.data?.items.some((item) => item.id === profile.id));

  const verified = profile.isVerifiedDisplay || Boolean(store?.isVerified);
  const displayName = profile.displayName.trim() || profile.username;

  return (
    <header className="relative overflow-hidden">
      <div
        className="relative -mx-4 -mt-4 w-[calc(100%+2rem)] overflow-hidden rounded-t-[1.25rem]"
        style={{ aspectRatio: `${SOCIAL.coverAspectRatio} / 1` }}
      >
        {isOwnProfile ? (
          <ProfileCoverEditor coverUrl={profile.coverUrl} />
        ) : profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="size-full object-cover object-center" />
        ) : (
          <div
            className="size-full bg-gradient-to-br from-brand-900 via-brand-700 to-accent-500"
            aria-hidden
          />
        )}
      </div>

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 px-1 sm:px-2">
        <div className="flex min-w-0 items-end gap-4">
          <div className="-mt-10 sm:-mt-12">
            {isOwnProfile ? (
              <ProfileAvatarEditor name={displayName} avatarUrl={profile.avatarUrl} />
            ) : (
              <ProfileAvatar name={displayName} url={profile.avatarUrl} />
            )}
          </div>
          <div className="min-w-0 pt-3 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-900 sm:text-3xl dark:text-foreground">
                {displayName}
              </h1>
              {profile.kind === 'BUSINESS' ? (
                <span className="rounded-md bg-accent-500 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">
                  {t('social.storeBadge')}
                </span>
              ) : null}
              {verified ? (
                <span className="text-xs font-medium text-accent-600" title={t('provider.verified')}>
                  ✓
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-foreground-muted">@{profile.username}</p>
            {profile.kind === SocialProfileKind.PERSONAL ? (
              <ProfileHeadline profile={profile} isOwn={isOwnProfile} />
            ) : profile.headline ? (
              <p className="mt-1 text-sm text-foreground">{profile.headline}</p>
            ) : null}
            {profile.locationText ? (
              <p className="mt-1 text-sm text-foreground-muted">{profile.locationText}</p>
            ) : null}
          </div>
        </div>

        {session.data && !isOwnProfile ? (
          <div className="flex flex-wrap gap-2">
            <Button
              className={
                isFollowing
                  ? undefined
                  : 'h-11 min-w-[8.5rem] bg-accent-500 px-5 text-base font-semibold text-white hover:bg-accent-600'
              }
              variant={isFollowing ? 'outline' : 'primary'}
              disabled={follow.isPending || unfollow.isPending}
              onClick={() => (isFollowing ? unfollow.mutate() : follow.mutate())}
            >
              {isFollowing ? t('social.unfollow') : t('social.follow')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={message.isPending}
              onClick={() =>
                message.mutate(undefined, {
                  onSuccess: (conversation) => router.push(`/mesajlar/${conversation.id}`),
                })
              }
            >
              {t('social.messageCta')}
            </Button>
            {store ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/tedarik?magaza=${encodeURIComponent(profile.username)}`)}
              >
                {t('social.requestQuoteCta')}
              </Button>
            ) : null}
            <Button size="sm" variant="outline" onClick={() => setReportOpen(true)}>
              {t('social.report')}
            </Button>
          </div>
        ) : null}
      </div>

      {store?.categories.length ? (
        <ul className="mt-4 flex flex-wrap gap-2 px-1 sm:px-2">
          {store.categories.map((category) => (
            <li
              key={category.id}
              className="rounded-lg border border-border bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground-muted"
            >
              {category.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative z-10 mt-5 flex flex-wrap gap-6 border-t border-border/70 px-1 pt-5 text-sm sm:px-2">
        <Stat label={t('social.posts')} value={profile.postCount} onClick={onOpenPosts} />
        <Stat
          label={t('social.followers')}
          value={profile.followerCount}
          onClick={onOpenFollowers}
        />
        <Stat
          label={t('social.following')}
          value={profile.followingCount}
          onClick={onOpenFollowing}
        />
        {store ? (
          <>
            {store.rating != null ? (
              <Stat label={t('social.ratingLabel')} value={store.rating.toFixed(1)} />
            ) : null}
            {store.reviewCount > 0 ? (
              <Stat label={t('social.reviewCountLabel')} value={store.reviewCount} />
            ) : null}
            {store.responseRate != null ? (
              <Stat
                label={t('social.responseRateLabel')}
                value={t('social.percentValue', { count: store.responseRate })}
              />
            ) : null}
            {store.averageResponseMinutes != null ? (
              <Stat
                label={t('social.responseTimeLabel')}
                value={t('social.minutesShort', { count: store.averageResponseMinutes })}
              />
            ) : null}
            {store.offerAcceptanceRate != null ? (
              <Stat
                label={t('social.acceptanceRateLabel')}
                value={t('social.percentValue', { count: store.offerAcceptanceRate })}
              />
            ) : null}
            {store.completedOrderCount > 0 ? (
              <Stat label={t('social.completedOrdersLabel')} value={store.completedOrderCount} />
            ) : null}
            {store.trustScore ? (
              <Stat label={t('social.trustScoreLabel')} value={store.trustScore.score} />
            ) : null}
            <Stat
              label={t('social.interactionsLabel')}
              value={
                profile.followerCount +
                profile.postCount +
                (store.reviewCount ?? 0) +
                store.completedOrderCount
              }
            />
          </>
        ) : null}
      </div>

      {reportOpen ? (
        <ReportDialog
          targetType="PROFILE"
          targetId={profile.id}
          onClose={() => setReportOpen(false)}
        />
      ) : null}
    </header>
  );
}

function ProfileHeadline({ profile, isOwn }: { profile: SocialProfile; isOwn: boolean }) {
  const update = useUpdateSocialProfile();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile.headline ?? '');

  if (!isOwn) {
    if (!profile.headline) return null;
    return <p className="mt-1 text-sm font-medium text-foreground">{profile.headline}</p>;
  }

  if (editing) {
    return (
      <form
        className="mt-2 flex max-w-md flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate(
            { headline: value.trim() || null },
            { onSuccess: () => setEditing(false) },
          );
        }}
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('social.headlinePlaceholder')}
          maxLength={120}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" isLoading={update.isPending}>
            {t('common.save')}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-1 text-left text-sm font-medium text-foreground hover:underline"
    >
      {profile.headline?.trim() || t('social.headlinePlaceholder')}
    </button>
  );
}

function Stat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  const className = onClick
    ? '-mx-2 rounded-xl px-2 py-1 text-left transition-colors hover:bg-surface-muted'
    : undefined;
  const inner = (
    <>
      <span className="block text-[0.6875rem] font-semibold tracking-[0.06em] text-foreground-muted uppercase">
        {label}
      </span>
      <span className="mt-0.5 block font-display text-lg font-semibold tabular-nums text-brand-900 dark:text-foreground">
        {value}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  return <div>{inner}</div>;
}

function ProfileAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="size-20 shrink-0 rounded-2xl object-cover ring-4 ring-surface sm:size-24"
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid size-20 shrink-0 place-items-center rounded-2xl bg-accent-500 font-display text-2xl font-bold text-white ring-4 ring-surface sm:size-24',
      )}
    >
      {name.slice(0, 1).toLocaleUpperCase(localeTag())}
    </span>
  );
}
