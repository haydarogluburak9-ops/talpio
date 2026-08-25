'use client';

import type { SocialPost } from '@talpio/types';
import { cn } from '@talpio/ui';
import { Clapperboard, Layers3 } from 'lucide-react';

import {
  getDiscoverPostPreview,
  getDiscoverPostThumbnail,
  isDiscoverPostVideo,
} from './discover-post-media';

export function DiscoverGrid({
  posts,
  onSelect,
}: {
  posts: SocialPost[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0.5 sm:gap-1">
      {posts.map((post, index) => (
        <DiscoverGridTile key={post.id} post={post} onClick={() => onSelect(index)} />
      ))}
    </div>
  );
}

function DiscoverGridTile({ post, onClick }: { post: SocialPost; onClick: () => void }) {
  const thumbnail = getDiscoverPostThumbnail(post);
  const preview = getDiscoverPostPreview(post);
  const isVideo = isDiscoverPostVideo(post);
  const multi = post.media.length > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative aspect-square overflow-hidden bg-surface-muted text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2',
      )}
    >
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex size-full flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-700 to-accent-600 p-2">
          <span className="line-clamp-4 text-[11px] font-medium leading-snug text-white/95">
            {preview}
          </span>
          {post.author ? (
            <span className="truncate text-[10px] font-semibold text-white/80">
              @{post.author.username}
            </span>
          ) : null}
        </div>
      )}

      {(multi || isVideo) && (
        <span className="absolute right-1.5 top-1.5 text-white drop-shadow-md">
          {isVideo ? (
            <Clapperboard className="size-4" aria-hidden />
          ) : (
            <Layers3 className="size-4" aria-hidden />
          )}
        </span>
      )}

      <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 group-active:bg-black/20" />
    </button>
  );
}
