'use client';

import type { SocialPost } from '@talpio/types';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { t } from '@/lib/i18n';

import { PostCard } from './post-card';

export function DiscoverViewer({
  posts,
  startIndex,
  onClose,
}: {
  posts: SocialPost[];
  startIndex: number;
  onClose: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const target = scroller.children[startIndex] as HTMLElement | undefined;
    if (!target) return;
    target.scrollIntoView({ block: 'start' });
  }, [startIndex]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 grid size-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 sm:right-4 sm:top-4"
        aria-label={t('common.close')}
      >
        <X className="size-5" />
      </button>

      <div
        ref={scrollerRef}
        className="h-[100dvh] overflow-y-auto overscroll-y-contain scroll-smooth snap-y snap-mandatory"
      >
        {posts.map((post) => (
          <section
            key={post.id}
            className="flex min-h-[100dvh] snap-start snap-always items-center justify-center px-2 py-4 sm:px-4"
          >
            <div className="w-full max-w-lg">
              <PostCard post={post} interactive />
            </div>
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}
