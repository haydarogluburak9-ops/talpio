'use client';

import type { SocialPost } from '@talpio/types';
import { cn } from '@talpio/ui';
import { Bookmark, ChevronDown, ChevronUp, Heart, MessageCircle, Send, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { localeTag, t } from '@/lib/i18n';

import {
  useCreateComment,
  useFollow,
  useLikePost,
  usePostComments,
  useRecordPostView,
  useSavePost,
  useSharePost,
  useSocialMe,
  useUnlikePost,
  useUnsavePost,
} from './use-social';

const DOUBLE_TAP_MS = 300;
const CAPTION_LIMIT = 180;

/**
 * Izgaradan seçilen gönderiyi tam ekran açar. Dikey kaydırma diğer
 * gönderilere geçer, çift dokunuş beğenir (Instagram davranışı).
 */
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
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    (scroller.children[startIndex] as HTMLElement | undefined)?.scrollIntoView({ block: 'start' });
  }, [startIndex]);

  useEffect(() => {
    function goTo(next: number) {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const target = scroller.children[next] as HTMLElement | undefined;
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }

    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (event.key === 'Escape') (event.target as HTMLElement).blur();
        return;
      }
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(Math.min(posts.length - 1, index + 1));
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(Math.max(0, index - 1));
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onClose, posts.length]);

  if (typeof document === 'undefined') return null;

  function step(delta: number) {
    const scroller = scrollerRef.current;
    const next = Math.min(posts.length - 1, Math.max(0, index + delta));
    (scroller?.children[next] as HTMLElement | undefined)?.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-30 grid size-10 place-items-center rounded-full text-white/90 hover:bg-white/10 sm:right-5 sm:top-5"
        aria-label={t('common.close')}
      >
        <X className="size-6" />
      </button>

      {index > 0 ? (
        <button
          type="button"
          onClick={() => step(-1)}
          className="absolute right-5 top-1/2 z-30 hidden size-10 -translate-y-14 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 lg:grid"
          aria-label={t('social.previousPost')}
        >
          <ChevronUp className="size-5" />
        </button>
      ) : null}
      {index < posts.length - 1 ? (
        <button
          type="button"
          onClick={() => step(1)}
          className="absolute right-5 top-1/2 z-30 hidden size-10 translate-y-4 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 lg:grid"
          aria-label={t('social.nextPost')}
        >
          <ChevronDown className="size-5" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          const next = Math.round(el.scrollTop / Math.max(1, el.clientHeight));
          setIndex((current) => (current === next ? current : next));
        }}
        className="h-[100dvh] snap-y snap-mandatory overflow-y-auto overscroll-y-contain"
      >
        {posts.map((post, position) => (
          <section
            key={post.id}
            className="flex h-[100dvh] snap-start snap-always items-center justify-center p-0 sm:p-6"
          >
            <ViewerPost post={post} active={Math.abs(position - index) <= 1} />
          </section>
        ))}
      </div>
    </div>,
    document.body,
  );
}

function ViewerPost({ post, active }: { post: SocialPost; active: boolean }) {
  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const share = useSharePost();
  const comments = usePostComments(post.id, active);
  const createComment = useCreateComment(post.id);
  const recordView = useRecordPostView();
  const me = useSocialMe(active);
  const follow = useFollow(post.author?.username ?? '');

  const [commentBody, setCommentBody] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [slide, setSlide] = useState(0);
  const [burst, setBurst] = useState(0);
  const lastTapRef = useRef(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!active) return;
    recordView.mutate(post.id);
    // Görünüme giren gönderi için tek gösterim; benzersiz kısıt tekrarları eler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, post.id]);

  const author = post.author;
  const media = post.media ?? [];
  const isOwn = Boolean(me.data && author && me.data.id === author.id);
  const showFollow = Boolean(author) && !isOwn && !author?.isFollowing;
  const body = post.body ?? '';
  const longBody = body.length > CAPTION_LIMIT;
  const caption = expanded || !longBody ? body : `${body.slice(0, CAPTION_LIMIT).trimEnd()}… `;

  function likeNow() {
    setBurst((value) => value + 1);
    if (!post.likedByMe && !like.isPending) like.mutate(post.id);
  }

  function onMediaTap() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      likeNow();
      return;
    }
    lastTapRef.current = now;
  }

  return (
    <article className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-surface sm:h-auto sm:max-h-[88dvh] sm:rounded-2xl lg:flex-row">
      <div
        onPointerUp={onMediaTap}
        className="relative flex min-h-0 flex-[1.4] select-none items-center justify-center overflow-hidden bg-black lg:flex-[1.6]"
      >
        {media.length > 0 ? (
          <div
            onScroll={(event) => {
              const el = event.currentTarget;
              setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
            }}
            className="flex size-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
          >
            {media.map((file) => (
              <div
                key={file.id}
                className="flex size-full shrink-0 snap-center items-center justify-center"
              >
                {file.mimeType.startsWith('video/') ? (
                  <video
                    src={file.url}
                    controls
                    playsInline
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.url} alt="" className="max-h-full max-w-full object-contain" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="max-h-full overflow-y-auto whitespace-pre-line px-8 py-12 text-center text-lg leading-relaxed font-medium text-white">
            {body}
          </p>
        )}

        {media.length > 1 ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {media.map((file, position) => (
              <span
                key={file.id}
                className={cn(
                  'size-1.5 rounded-full bg-white/40',
                  position === slide && 'bg-white',
                )}
              />
            ))}
          </div>
        ) : null}

        {burst > 0 ? (
          <Heart
            key={burst}
            aria-hidden
            className="ig-heart-burst pointer-events-none absolute size-28 fill-white text-white drop-shadow-[0_2px_12px_rgb(0_0_0_/_0.45)]"
          />
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border lg:w-[380px] lg:max-w-[380px] lg:flex-none lg:border-l lg:border-t-0">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link
            href={author ? `/u/${author.username}` : '#'}
            className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-[11px] font-bold text-white"
          >
            {author?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              (author?.displayName ?? 'T').slice(0, 2).toUpperCase()
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              href={author ? `/u/${author.username}` : '#'}
              className="block truncate text-sm font-semibold text-foreground hover:underline"
            >
              {author?.username ? `@${author.username}` : (author?.displayName ?? '—')}
            </Link>
            {author?.locationText ? (
              <p className="truncate text-xs text-foreground-muted">{author.locationText}</p>
            ) : null}
          </div>
          {showFollow ? (
            <button
              type="button"
              disabled={follow.isPending}
              onClick={() => follow.mutate()}
              className="shrink-0 rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white hover:bg-accent-600"
            >
              {t('social.followCta')}
            </button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {body ? (
            <div className="text-sm leading-relaxed">
              <Link
                href={author ? `/u/${author.username}` : '#'}
                className="mr-1.5 font-semibold text-foreground hover:underline"
              >
                {author?.username ?? author?.displayName ?? '—'}
              </Link>
              <RichText body={caption} />
              {longBody && !expanded ? (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-foreground-muted hover:underline"
                >
                  {t('social.captionMore')}
                </button>
              ) : null}
            </div>
          ) : null}

          {comments.isPending && active ? (
            <p className="text-sm text-foreground-muted">…</p>
          ) : comments.data?.items.length ? (
            <ul className="space-y-3">
              {comments.data.items.map((comment) => (
                <li key={comment.id} className="flex gap-2.5 text-sm leading-relaxed">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-700 text-[10px] font-bold text-white">
                    {comment.author?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={comment.author.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      (comment.author?.displayName ?? '?').slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <p className="min-w-0">
                    <Link
                      href={comment.author ? `/u/${comment.author.username}` : '#'}
                      className="mr-1.5 font-semibold text-foreground hover:underline"
                    >
                      {comment.author?.username ?? comment.author?.displayName ?? '—'}
                    </Link>
                    <span className="whitespace-pre-line text-foreground">{comment.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground-muted">{t('social.commentEmpty')}</p>
          )}
        </div>

        <div className="border-t border-border px-4 pt-2.5">
          <div className="flex items-center gap-1">
            <IconAction
              label={t('social.like')}
              active={post.likedByMe}
              disabled={like.isPending || unlike.isPending}
              onClick={() => (post.likedByMe ? unlike.mutate(post.id) : likeNow())}
            >
              <Heart
                className={cn('size-6', post.likedByMe && 'fill-danger-500 text-danger-500')}
              />
            </IconAction>
            <IconAction
              label={t('social.comment')}
              onClick={() => commentInputRef.current?.focus()}
            >
              <MessageCircle className="size-6" />
            </IconAction>
            <IconAction
              label={t('social.share')}
              active={post.sharedByMe}
              disabled={share.isPending}
              onClick={() => share.mutate(post.id)}
            >
              <Send className="size-6" />
            </IconAction>
            <IconAction
              label={t('social.save')}
              active={post.savedByMe}
              disabled={save.isPending || unsave.isPending}
              onClick={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}
              className="ml-auto"
            >
              <Bookmark className={cn('size-6', post.savedByMe && 'fill-current')} />
            </IconAction>
          </div>

          <p className="pt-1 text-sm font-semibold text-foreground">
            {t('social.likesCount', { count: post.likeCount })}
          </p>
          <p className="pb-2 text-[11px] tracking-wide text-foreground-muted uppercase">
            {new Date(post.createdAt).toLocaleDateString(localeTag(), {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>

        <form
          className="flex items-center gap-2 border-t border-border px-4 py-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            const value = commentBody.trim();
            if (!value) return;
            createComment.mutate({ body: value }, { onSuccess: () => setCommentBody('') });
          }}
        >
          <input
            ref={commentInputRef}
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder={t('social.addComment')}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-foreground-muted"
          />
          <button
            type="submit"
            disabled={createComment.isPending || commentBody.trim().length === 0}
            className="shrink-0 text-sm font-semibold text-info-500 disabled:opacity-40"
          >
            {t('social.sendComment')}
          </button>
        </form>
      </div>
    </article>
  );
}

function IconAction({
  label,
  active,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'grid size-10 place-items-center rounded-full text-foreground transition-transform hover:scale-105 disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Etiket ve bahsetmeleri bağlantıya çevirir, satır sonlarını korur. */
function RichText({ body }: { body: string }) {
  const parts = body.split(/(#[\p{L}\p{N}_]{2,40}|@[a-z0-9._]{2,32})/gu);
  return (
    <span className="whitespace-pre-line text-foreground">
      {parts.map((part, position) => {
        if (part.startsWith('#')) {
          const slug = part.slice(1).toLocaleLowerCase(localeTag());
          return (
            <Link
              key={`${slug}-${position}`}
              href={`/gundem/${encodeURIComponent(slug)}`}
              className="text-info-500 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          return (
            <Link
              key={`${part}-${position}`}
              href={`/u/${part.slice(1).toLowerCase()}`}
              className="text-info-500 hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={position}>{part}</span>;
      })}
    </span>
  );
}
