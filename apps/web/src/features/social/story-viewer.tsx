'use client';

import type { SocialPost, SocialProfile, StoryHighlight } from '@talpio/types';
import { Bookmark, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { t } from '@/lib/i18n';

export type StoryGroup = {
  author: SocialProfile;
  posts: SocialPost[];
};

const STORY_MS = 5500;

export function groupStories(posts: SocialPost[], meId?: string): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const post of posts) {
    if (!post.author || post.media.length === 0) continue;
    const current = map.get(post.author.id);
    if (current) current.posts.push(post);
    else map.set(post.author.id, { author: post.author, posts: [post] });
  }

  return [...map.values()].sort((a, b) => {
    if (meId && a.author.id === meId) return -1;
    if (meId && b.author.id === meId) return 1;
    const aTime = new Date(a.posts[a.posts.length - 1]?.createdAt ?? 0).getTime();
    const bTime = new Date(b.posts[b.posts.length - 1]?.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

export function StoryViewer({
  groups,
  startGroup,
  onClose,
  persistTimer = false,
  onAddToHighlight,
  highlights,
  onPickHighlight,
}: {
  groups: StoryGroup[];
  startGroup: number;
  onClose: () => void;
  /** Öne çıkan hikâyelerde otomatik ilerleme kapalı kalabilir. */
  persistTimer?: boolean;
  onAddToHighlight?: (postId: string) => void;
  highlights?: StoryHighlight[];
  onPickHighlight?: (highlightId: string, postId: string) => void;
}) {
  const [groupIndex, setGroupIndex] = useState(startGroup);
  const [itemIndex, setItemIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const group = groups[groupIndex];
  const post = group?.posts[itemIndex];
  const media = post?.media[0];

  const initials = useMemo(
    () =>
      (group?.author.displayName ?? '?')
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [group?.author.displayName],
  );

  useEffect(() => {
    setGroupIndex(startGroup);
    setItemIndex(0);
  }, [startGroup]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!post || persistTimer) return;
    const timer = window.setTimeout(() => goNext(), STORY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, itemIndex, post?.id, persistTimer]);

  function goNext() {
    if (!group) return;
    if (itemIndex < group.posts.length - 1) {
      setItemIndex((value) => value + 1);
      return;
    }
    if (groupIndex < groups.length - 1) {
      setGroupIndex((value) => value + 1);
      setItemIndex(0);
      return;
    }
    onClose();
  }

  function goPrev() {
    if (!group) return;
    if (itemIndex > 0) {
      setItemIndex((value) => value - 1);
      return;
    }
    if (groupIndex > 0) {
      const previous = groups[groupIndex - 1];
      setGroupIndex((value) => value - 1);
      setItemIndex(Math.max(0, (previous?.posts.length ?? 1) - 1));
    }
  }

  if (!group || !post || !media) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={t('social.storiesTitle')}
    >
      <button
        type="button"
        className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label={t('social.closeStory')}
      >
        <X className="size-5" />
      </button>

      {onAddToHighlight && post ? (
        <button
          type="button"
          className="absolute top-4 right-16 z-10 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label={t('social.addToHighlight')}
          onClick={() => {
            if (highlights?.length && onPickHighlight) setPickerOpen(true);
            else onAddToHighlight(post.id);
          }}
        >
          <Bookmark className="size-5" />
        </button>
      ) : null}

      {pickerOpen && post && highlights && onPickHighlight ? (
        <div className="absolute inset-x-4 bottom-24 z-20 max-h-48 overflow-y-auto rounded-2xl bg-black/85 p-2">
          {highlights.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-white hover:bg-white/10"
              onClick={() => {
                onPickHighlight(item.id, post.id);
                setPickerOpen(false);
              }}
            >
              {item.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.coverUrl} alt="" className="size-9 rounded-full object-cover" />
              ) : (
                <span className="grid size-9 place-items-center rounded-full bg-brand-700 text-xs font-bold">
                  {item.title.slice(0, 1)}
                </span>
              )}
              <span className="text-sm font-medium">{item.title}</span>
            </button>
          ))}
          <button
            type="button"
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-accent-300 hover:bg-white/10"
            onClick={() => {
              setPickerOpen(false);
              onAddToHighlight(post.id);
            }}
          >
            + {t('social.newHighlight')}
          </button>
        </div>
      ) : null}

      <div className="relative h-[min(92svh,820px)] w-full max-w-[420px] overflow-hidden rounded-[1.5rem] bg-brand-950 shadow-2xl">
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {group.posts.map((item, index) => (
            <div key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className={
                  index < itemIndex
                    ? 'h-full w-full bg-white'
                    : index === itemIndex
                      ? 'story-progress h-full bg-white'
                      : 'h-full w-0 bg-white'
                }
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-6 z-10 flex items-center gap-3 px-4 pt-2">
          <Link
            href={`/u/${group.author.username}`}
            className="grid size-10 place-items-center overflow-hidden rounded-full bg-brand-700 text-xs font-bold text-white ring-2 ring-white/70"
            onClick={onClose}
          >
            {group.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.author.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials
            )}
          </Link>
          <div className="min-w-0 text-white">
            <p className="truncate text-sm font-semibold">{group.author.displayName}</p>
            <p className="text-xs text-white/70">@{group.author.username}</p>
          </div>
        </div>

        {media.mimeType.startsWith('video/') ? (
          <video src={media.url} autoPlay muted playsInline className="size-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.url} alt="" className="size-full object-cover" />
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-5 pt-16 pb-6 text-white">
          {post.body ? <p className="line-clamp-4 text-[15px] leading-relaxed">{post.body}</p> : null}
          {post.deal?.title || post.promo?.label ? (
            <p className="mt-2 text-sm font-semibold text-accent-300">
              {post.deal?.title ?? post.promo?.label}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="absolute inset-y-0 left-0 w-1/3"
          aria-label={t('social.prevStory')}
          onClick={goPrev}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 w-2/3"
          aria-label={t('social.nextStory')}
          onClick={goNext}
        />
      </div>
    </div>
  );
}
