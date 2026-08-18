'use client';

import { DEFAULT_CURRENCY } from '@talpio/config';
import { formatMoneyMinor } from '@talpio/localization';
import type { SocialPost } from '@talpio/types';
import { Button, cn } from '@talpio/ui';
import {
  Bookmark,
  ClipboardPlus,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Quote,
  Repeat2,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { localeTag, t } from '@/lib/i18n';

import { ReportDialog } from './report-dialog';
import {
  useCreateComment,
  useCreatePost,
  useCreateRequestFromPost,
  useFollow,
  useHidePost,
  useLikePost,
  usePostComments,
  useRecordPostView,
  useSavePost,
  useSharePost,
  useSocialMe,
  useUnlikePost,
  useUnsavePost,
} from './use-social';

const DEALISH_TYPES = new Set([
  'DEAL',
  'SPECIAL_PRICE',
  'DISCOUNT',
  'CAMPAIGN',
  'BULK_PRICE',
  'LIMITED_STOCK',
  'CLEARANCE',
  'SERVICE_PROMOTION',
  'B2B_CAMPAIGN',
  'NEW_PRODUCT',
]);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

function PostBody({ body }: { body: string }) {
  const parts = body.split(/(#[\p{L}\p{N}_]{2,40}|@[a-z0-9._]{2,32})/gu);
  return (
    <p className="whitespace-pre-wrap px-5 pt-3 text-[16px] leading-relaxed text-foreground">
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          const slug = part.slice(1).toLocaleLowerCase(localeTag());
          return (
            <Link
              key={`${slug}-${index}`}
              href={`/gundem/${encodeURIComponent(slug)}`}
              className="font-semibold text-accent-600 hover:underline"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith('@')) {
          const username = part.slice(1).toLowerCase();
          return (
            <Link
              key={`${username}-${index}`}
              href={`/u/${username}`}
              className="font-semibold text-brand-800 hover:underline dark:text-brand-200"
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

function NestedOriginal({ post }: { post: SocialPost }) {
  const author = post.author;
  return (
    <div className="mx-4 mt-3 rounded-2xl border border-border bg-surface-muted/40 p-3">
      <p className="text-xs font-semibold text-foreground-muted">
        {author ? (
          <Link href={`/u/${author.username}`} className="hover:underline">
            {author.displayName}
          </Link>
        ) : (
          t('social.quotedFrom')
        )}
      </p>
      {post.body ? <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{post.body}</p> : null}
    </div>
  );
}

export function PostCard({
  post,
  interactive = false,
}: {
  post: SocialPost;
  interactive?: boolean;
}) {
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: 'POST' | 'COMMENT';
    id: string;
  } | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteBody, setQuoteBody] = useState('');
  const like = useLikePost();
  const unlike = useUnlikePost();
  const save = useSavePost();
  const unsave = useUnsavePost();
  const share = useSharePost();
  const hide = useHidePost();
  const createPost = useCreatePost();
  const recordView = useRecordPostView();
  const comments = usePostComments(post.id, showComments);
  const createComment = useCreateComment(post.id);
  const createRequest = useCreateRequestFromPost();
  const me = useSocialMe(interactive);
  const follow = useFollow(post.author?.username ?? '');
  const [commentBody, setCommentBody] = useState('');

  useEffect(() => {
    if (!interactive) return;
    recordView.mutate(post.id);
    // One impression per mount; unique constraint dedupes Strict Mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, post.id]);

  const author = post.author;
  const promo = post.promo;
  const deal = post.deal;
  const original = post.originalPost ?? null;
  const isRepost = post.type === 'REPOST';
  const showDealCta =
    interactive &&
    (Boolean(deal) || Boolean(promo) || DEALISH_TYPES.has(post.type));
  const initials = (author?.displayName ?? 'T')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const shareCount = post.shareCount ?? 0;
  const repostCount = post.repostCount ?? 0;
  const tags = post.hashtags ?? [];
  const isOwn = Boolean(me.data && author && me.data.id === author.id);
  const showFollow = interactive && Boolean(author) && !isOwn && !author?.isFollowing;

  return (
    <article className="social-panel social-post overflow-hidden">
      <header className="flex items-start gap-3 px-5 pt-5">
        <Link
          href={author ? `/u/${author.username}` : '#'}
          className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-xs font-bold text-white ring-2 ring-accent-400/70 ring-offset-2 ring-offset-surface"
        >
          {author?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {author ? (
              <Link
                href={`/u/${author.username}`}
                className="truncate text-[15px] font-semibold text-foreground hover:underline"
              >
                {author.displayName}
              </Link>
            ) : null}
            {isRepost ? (
              <span className="text-xs text-foreground-muted">{t('social.repostedBy')}</span>
            ) : null}
            {author?.isVerifiedDisplay ? (
              <span className="text-info-500" title="Doğrulanmış" aria-label="Doğrulanmış">
                ✓
              </span>
            ) : null}
            {post.type === 'CAMPAIGN' || post.type === 'B2B_CAMPAIGN' ? (
              <span className="rounded-md bg-success-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-success-700 uppercase dark:text-success-500">
                {t('social.campaignBadge')}
              </span>
            ) : post.type === 'REQUEST_SHARE' ? (
              <span className="rounded-md bg-warning-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-warning-700 uppercase">
                {t('social.requestBadge')}
              </span>
            ) : DEALISH_TYPES.has(post.type) || promo || deal ? (
              <span className="rounded-md bg-accent-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-accent-700 uppercase dark:text-accent-300">
                {t('social.dealBadge')}
              </span>
            ) : null}
            {showFollow ? (
              <button
                type="button"
                disabled={follow.isPending}
                onClick={() => author?.username && follow.mutate()}
                className="rounded-full bg-accent-500 px-3 py-0.5 text-[12px] font-semibold text-white hover:bg-accent-600"
              >
                {t('social.followCta')}
              </button>
            ) : null}
          </div>
          <p className="text-xs text-foreground-muted">
            {[author?.locationText, timeAgo(post.createdAt)].filter(Boolean).join(' · ')}
          </p>
        </div>
        {interactive ? (
          <div className="relative">
            <button
              type="button"
              className="rounded-full p-2 text-foreground-muted hover:bg-surface-muted"
              aria-label={t('social.moreActions')}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="size-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-soft">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  disabled={createPost.isPending}
                  onClick={() => {
                    createPost.mutate({ originalPostId: post.originalPostId ?? post.id });
                    setMenuOpen(false);
                  }}
                >
                  <Repeat2 className="size-4" />
                  {t('social.repost')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  onClick={() => {
                    setQuoteOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  {t('social.quote')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-surface-muted"
                  disabled={hide.isPending}
                  onClick={() => {
                    hide.mutate(post.id);
                    setMenuOpen(false);
                  }}
                >
                  {t('social.hide')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-surface-muted"
                  onClick={() => {
                    setReportTarget({ type: 'POST', id: post.id });
                    setMenuOpen(false);
                  }}
                >
                  {t('social.report')}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            className="rounded-full p-2 text-foreground-muted hover:bg-surface-muted"
            aria-label={t('social.moreActions')}
          >
            <MoreHorizontal className="size-5" />
          </button>
        )}
      </header>

      {post.media.length > 0 ? (
        <div
          className={cn(
            'mt-3 grid gap-0.5 bg-brand-950/5',
            post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {post.media.map((file) =>
            file.mimeType.startsWith('video/') ? (
              <video
                key={file.id}
                src={file.url}
                controls
                playsInline
                className="max-h-[560px] w-full bg-brand-950 object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={file.id}
                src={file.url}
                alt=""
                className="max-h-[560px] w-full object-cover"
              />
            ),
          )}
        </div>
      ) : null}

      {post.body ? <PostBody body={post.body} /> : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-5 pt-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/gundem/${encodeURIComponent(tag)}`}
              className="rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-500/20 dark:text-accent-300"
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      {original ? <NestedOriginal post={original} /> : null}

      {promo || deal ? (
        <div className="mx-4 mt-3 overflow-hidden rounded-2xl border border-accent-200/70 bg-gradient-to-br from-accent-50 via-surface to-warning-50 dark:border-accent-800/40 dark:from-accent-900/20 dark:via-surface dark:to-surface">
          <div className="px-4 py-4">
            {promo?.label || deal?.title || deal?.productName ? (
              <p className="text-base font-semibold text-brand-900 dark:text-foreground">
                {promo?.label ?? deal?.title ?? deal?.productName}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <div>
                {(deal?.listPriceMinor ?? promo?.originalPriceMinor) != null ? (
                  <p className="text-xs text-foreground-muted">
                    {t('social.normalPrice')}{' '}
                    <span className="line-through">
                      {formatMoneyMinor(
                        (deal?.listPriceMinor ?? promo?.originalPriceMinor) as number,
                        deal?.currency ?? promo?.currency ?? DEFAULT_CURRENCY,
                      )}
                    </span>
                  </p>
                ) : null}
                {(deal?.dealPriceMinor ?? promo?.promoPriceMinor) != null ? (
                  <p className="mt-0.5 text-xs font-medium text-foreground-muted">
                    {t('social.specialPrice')}
                  </p>
                ) : null}
                {(deal?.dealPriceMinor ?? promo?.promoPriceMinor) != null ? (
                  <p className="text-[1.75rem] leading-none font-bold tracking-tight text-accent-500">
                    {formatMoneyMinor(
                      (deal?.dealPriceMinor ?? promo?.promoPriceMinor) as number,
                      deal?.currency ?? promo?.currency ?? DEFAULT_CURRENCY,
                    )}
                  </p>
                ) : null}
              </div>
              {deal?.discountPercent != null && deal.discountPercent > 0 ? (
                <span className="rounded-lg bg-accent-500 px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase">
                  {t('social.discountBadge', { percent: String(deal.discountPercent) })}
                </span>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {deal?.stockQuantity ? (
                <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-foreground-muted">
                  {deal.stockQuantity}
                </span>
              ) : null}
              {deal?.locationText || author?.locationText ? (
                <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-foreground-muted">
                  {deal?.locationText ?? author?.locationText}
                </span>
              ) : null}
              {deal?.shippingIncluded != null ? (
                <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-foreground-muted">
                  {deal.shippingIncluded
                    ? t('social.shippingIncludedYes')
                    : t('social.shippingIncludedNo')}
                </span>
              ) : null}
              {promo?.validUntil || deal?.endsAt ? (
                <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-medium text-foreground-muted">
                  {t('social.promoUntil', {
                    date: new Date(
                      (promo?.validUntil ?? deal?.endsAt) as string,
                    ).toLocaleDateString(localeTag()),
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pt-3 text-xs font-medium text-foreground-muted">
        <span>{t('social.likesCount', { count: post.likeCount })}</span>
        <span>{t('social.commentsCount', { count: post.commentCount })}</span>
        <span>{t('social.sharesCount', { count: shareCount })}</span>
        <span>{t('social.savesCount', { count: post.saveCount })}</span>
        {repostCount > 0 ? (
          <span>{t('social.repostsCount', { count: repostCount })}</span>
        ) : null}
      </div>

      {interactive ? (
        <div className="mt-1 flex flex-col gap-2 border-t border-border/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center justify-around gap-1 sm:justify-start sm:gap-1">
            <button
              type="button"
              disabled={like.isPending || unlike.isPending}
              onClick={() => (post.likedByMe ? unlike.mutate(post.id) : like.mutate(post.id))}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger-500 hover:bg-danger-50',
                post.likedByMe && 'bg-danger-50 text-danger-600',
              )}
            >
              <Heart className={cn('size-4', post.likedByMe && 'fill-current')} />
              {t('social.like')}
            </button>
            <button
              type="button"
              onClick={() => setShowComments((value) => !value)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-info-500 hover:bg-info-50',
                showComments && 'bg-info-50 text-info-700',
              )}
            >
              <MessageCircle className="size-4" />
              {t('social.comment')}
            </button>
            <button
              type="button"
              disabled={share.isPending}
              onClick={() => share.mutate(post.id)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-success-500 hover:bg-success-50',
                post.sharedByMe && 'bg-success-50 text-success-700',
              )}
            >
              <Share2 className="size-4" />
              {t('social.share')}
            </button>
            <button
              type="button"
              disabled={createPost.isPending}
              onClick={() => createPost.mutate({ originalPostId: post.originalPostId ?? post.id })}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-violet-500 hover:bg-violet-50"
            >
              <Repeat2 className="size-4" />
              {t('social.repost')}
            </button>
            <button
              type="button"
              onClick={() => setQuoteOpen((open) => !open)}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-warning-500 hover:bg-warning-50',
                quoteOpen && 'bg-warning-50 text-warning-700',
              )}
            >
              <Quote className="size-4" />
              {t('social.quote')}
            </button>
            <button
              type="button"
              disabled={save.isPending || unsave.isPending}
              onClick={() => (post.savedByMe ? unsave.mutate(post.id) : save.mutate(post.id))}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-accent-500 hover:bg-accent-50',
                post.savedByMe && 'bg-accent-50 text-accent-700',
              )}
            >
              <Bookmark className={cn('size-4', post.savedByMe && 'fill-current')} />
              {t('social.save')}
            </button>
          </div>
          {showDealCta ? (
            <button
              type="button"
              disabled={createRequest.isPending}
              onClick={() =>
                createRequest.mutate(
                  { postId: post.id },
                  {
                    onSuccess: (request) => {
                      router.push(`/tedarik/${request.id}`);
                    },
                  },
                )
              }
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgb(255_106_0_/_0.28)] hover:bg-accent-600"
            >
              <ClipboardPlus className="size-4" />
              {createRequest.isPending ? t('social.creatingRequest') : t('social.askOffer')}
            </button>
          ) : null}
        </div>
      ) : null}

      {interactive && quoteOpen ? (
        <form
          className="flex gap-2 border-t border-border/70 px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!quoteBody.trim()) return;
            createPost.mutate(
              { originalPostId: post.originalPostId ?? post.id, body: quoteBody.trim() },
              {
                onSuccess: () => {
                  setQuoteBody('');
                  setQuoteOpen(false);
                },
              },
            );
          }}
        >
          <input
            value={quoteBody}
            onChange={(event) => setQuoteBody(event.target.value)}
            placeholder={t('social.quotePlaceholder')}
            className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-500"
          />
          <Button type="submit" size="sm" disabled={createPost.isPending}>
            {t('social.quote')}
          </Button>
        </form>
      ) : null}

      {interactive && showComments ? (
        <div className="space-y-3 border-t border-border/70 bg-surface-muted/40 px-4 py-3">
          {comments.isPending ? (
            <p className="text-sm text-foreground-muted">…</p>
          ) : comments.data?.items.length ? (
            <ul className="space-y-3">
              {comments.data.items.map((comment) => (
                <li key={comment.id} className="flex gap-2 text-sm">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                    {(comment.author?.displayName ?? '?').slice(0, 1)}
                  </span>
                  <div className="min-w-0 rounded-2xl bg-surface px-3 py-2 shadow-soft">
                    <span className="font-semibold text-brand-800">
                      {comment.author?.displayName ?? '—'}
                    </span>
                    <p className="text-foreground">{comment.body}</p>
                    {interactive ? (
                      <button
                        type="button"
                        className="mt-1 text-xs text-danger-600 hover:underline"
                        onClick={() => setReportTarget({ type: 'COMMENT', id: comment.id })}
                      >
                        {t('social.report')}
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-foreground-muted">{t('social.commentEmpty')}</p>
          )}
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!commentBody.trim()) return;
              createComment.mutate(
                { body: commentBody.trim() },
                { onSuccess: () => setCommentBody('') },
              );
            }}
          >
            <input
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              placeholder={t('social.commentPlaceholder')}
              className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-brand-500"
            />
            <Button type="submit" size="sm" disabled={createComment.isPending}>
              {t('social.comment')}
            </Button>
          </form>
        </div>
      ) : null}
      {reportTarget ? (
        <ReportDialog
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          onClose={() => setReportTarget(null)}
        />
      ) : null}
    </article>
  );
}
