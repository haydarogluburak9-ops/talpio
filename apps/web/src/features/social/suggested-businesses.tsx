'use client';

import { Button } from '@talpio/ui';
import { Store } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { localeTag, t } from '@/lib/i18n';

import { useDiscoverFeed, useFollow, useUnfollow } from './use-social';

/**
 * Takip edilen işletme listeden hemen düşerse onay görülmeden kaybolur; satır
 * bu süre boyunca "takip ediyorsun" halinde bekletilir, sonra yerini yeni bir
 * öneriye bırakır.
 */
const FOLLOWED_HOLD_MS = 2500;

export function SuggestedBusinesses({
  compact = false,
  withIntro = false,
}: {
  compact?: boolean;
  withIntro?: boolean;
}) {
  const feed = useDiscoverFeed(true);
  const { heldIds, hold, release } = useFollowedHold();

  const posts = (feed.data?.items ?? [])
    .map((item) => item.post?.author)
    .filter((author): author is NonNullable<typeof author> => Boolean(author));

  const businesses = posts
    .filter((author, index, list) => list.findIndex((item) => item.id === author.id) === index)
    .filter((author) => author.kind === 'BUSINESS');

  const suggested = businesses
    .filter((author) => !author.isFollowing || heldIds.includes(author.id))
    .slice(0, compact ? 4 : 6);
  const newest = [...businesses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((author) => !suggested.some((item) => item.id === author.id))
    .slice(0, compact ? 0 : 4);
  const growing = [...businesses]
    .sort((a, b) => b.followerCount - a.followerCount)
    .filter(
      (author) =>
        !suggested.some((item) => item.id === author.id) &&
        !newest.some((item) => item.id === author.id),
    )
    .slice(0, compact ? 0 : 3);

  if (suggested.length === 0 && newest.length === 0) return null;

  if (withIntro && suggested.length > 0) {
    return (
      <div className="social-panel p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <Store className="size-4" aria-hidden />
          </span>
          <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
            {t('social.railBusinessTitle')}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-foreground-muted">{t('social.railBusinessBody')}</p>
        <ul className="mt-4 space-y-3">
          {suggested.map((author) => (
            <SuggestedRow
              key={author.id}
              username={author.username}
              name={author.displayName}
              avatarUrl={author.avatarUrl}
              isFollowing={author.isFollowing}
              held={heldIds.includes(author.id)}
              onFollowed={() => hold(author.id)}
              onUnfollowed={() => release(author.id)}
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggested.length > 0 ? (
        <BusinessBlock
          title={t('social.suggestedBusinesses')}
          authors={suggested}
          heldIds={heldIds}
          onFollowed={hold}
          onUnfollowed={release}
        />
      ) : null}
      {newest.length > 0 ? (
        <BusinessBlock
          title={t('social.newBusinesses')}
          authors={newest}
          heldIds={heldIds}
          onFollowed={hold}
          onUnfollowed={release}
        />
      ) : null}
      {growing.length > 0 ? (
        <BusinessBlock
          title={t('social.growingBusinesses')}
          authors={growing}
          heldIds={heldIds}
          onFollowed={hold}
          onUnfollowed={release}
        />
      ) : null}
    </div>
  );
}

/** Takip edilen satırların listede kısa süre daha kalmasını yöneten sayaçlar. */
function useFollowedHold() {
  const [heldIds, setHeldIds] = useState<string[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const release = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setHeldIds((current) => current.filter((item) => item !== id));
  }, []);

  const hold = useCallback(
    (id: string) => {
      const timer = timers.current.get(id);
      if (timer) clearTimeout(timer);

      setHeldIds((current) => (current.includes(id) ? current : [...current, id]));
      timers.current.set(
        id,
        setTimeout(() => release(id), FOLLOWED_HOLD_MS),
      );
    },
    [release],
  );

  return { heldIds, hold, release };
}

function BusinessBlock({
  title,
  authors,
  heldIds,
  onFollowed,
  onUnfollowed,
}: {
  title: string;
  authors: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    isFollowing?: boolean;
  }>;
  heldIds: string[];
  onFollowed: (id: string) => void;
  onUnfollowed: (id: string) => void;
}) {
  return (
    <div className="social-panel p-5">
      <p className="text-sm font-semibold tracking-tight text-brand-900 dark:text-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-3">
        {authors.map((author) => (
          <SuggestedRow
            key={author.id}
            username={author.username}
            name={author.displayName}
            avatarUrl={author.avatarUrl}
            isFollowing={author.isFollowing}
            held={heldIds.includes(author.id)}
            onFollowed={() => onFollowed(author.id)}
            onUnfollowed={() => onUnfollowed(author.id)}
          />
        ))}
      </ul>
    </div>
  );
}

const AVATAR_TONES = [
  'bg-accent-500',
  'bg-info-500',
  'bg-success-500',
  'bg-violet-500',
  'bg-warning-500',
  'bg-teal-500',
] as const;

function avatarTone(value: string) {
  return AVATAR_TONES[value.length % AVATAR_TONES.length];
}

function SuggestedRow({
  username,
  name,
  avatarUrl,
  isFollowing = false,
  held = false,
  onFollowed,
  onUnfollowed,
}: {
  username: string;
  name: string;
  avatarUrl?: string | null;
  isFollowing?: boolean;
  /** Takip edildikten sonra satırın bekletildiği kısa süre. */
  held?: boolean;
  onFollowed: () => void;
  onUnfollowed: () => void;
}) {
  const follow = useFollow(username);
  const unfollow = useUnfollow(username);
  const pending = follow.isPending || unfollow.isPending;
  // Takip bayrağı önbellekte tıklama anında güncellendiği için ayrı bir bekleme
  // durumu tutmak gerekmiyor; `held` yalnızca satırın listede kalma süresini
  // korur.
  const followed = held || isFollowing;

  return (
    <li className="flex items-center gap-3">
      <Link
        href={`/u/${username}`}
        className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full ${avatarUrl ? '' : `text-xs font-bold text-white ${avatarTone(username)}`}`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          name.slice(0, 1).toLocaleUpperCase(localeTag())
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/u/${username}`} className="block truncate text-sm font-semibold hover:underline">
          {name}
        </Link>
        <p className="truncate text-xs text-foreground-muted">@{username}</p>
      </div>
      <Button
        size="sm"
        variant={followed ? 'outline' : 'primary'}
        className={
          followed
            ? 'border-border bg-surface-muted text-foreground-muted hover:bg-surface-muted/70'
            : 'bg-accent-500 text-white hover:bg-accent-600'
        }
        disabled={pending}
        onClick={() => {
          if (followed) {
            onUnfollowed();
            unfollow.mutate();
            return;
          }
          // İyimser bayrak satırı öneri filtresinden hemen düşürebileceği için
          // bekletme tıklamayla başlar; istek reddedilirse bırakılır.
          onFollowed();
          follow.mutate(undefined, { onError: onUnfollowed });
        }}
      >
        {followed ? t('social.followingCta') : t('social.followCta')}
      </Button>
    </li>
  );
}
