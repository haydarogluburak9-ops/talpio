'use client';

import { DEFAULT_CURRENCY } from '@talpio/config';
import { formatMoneyMinor } from '@talpio/localization';
import type { SocialPost } from '@talpio/types';
import { Button, cn } from '@talpio/ui';
import {
  Bookmark,
  ClipboardPlus,
  HandCoins,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { localeTag, t } from '@/lib/i18n';

import { ReportDialog } from './report-dialog';
import {
  useCreateComment,
  useCreatePost,
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

const DOUBLE_TAP_MS = 300;
const CAPTION_LIMIT = 180;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60_000));
  if (minutes < 60) return `${minutes}dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}sa`;
  const days = Math.floor(hours / 24);
  return `${days}g`;
}

/** Etiket ve bahsetmeleri bağlantıya çevirir, satır sonlarını korur. */
function PostBody({ body }: { body: string }) {
  const parts = body.split(/(#[\p{L}\p{N}_]{2,40}|@[a-z0-9._]{2,32})/gu);
  return (
    <span className="whitespace-pre-line text-foreground">
      {parts.map((part, index) => {
        if (part.startsWith('#')) {
          const slug = part.slice(1).toLocaleLowerCase(localeTag());
          return (
            <Link
              key={`${slug}-${index}`}
              href={`/gundem/${encodeURIComponent(slug)}`}
              className="text-info-500 hover:underline"
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
              className="text-info-500 hover:underline"
            >
              {part}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
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
        'grid size-10 place-items-center rounded-full text-foreground transition-transform hover:scale-110 disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
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
      {post.body ? (
        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{post.body}</p>
      ) : null}
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
  const me = useSocialMe(interactive);
  const follow = useFollow(post.author?.username ?? '');
  const [commentBody, setCommentBody] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [burst, setBurst] = useState(0);
  const lastTapRef = useRef(0);
  const commentInputRef = useRef<HTMLInputElement>(null);

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
    interactive && (Boolean(deal) || Boolean(promo) || DEALISH_TYPES.has(post.type));
  const initials = (author?.displayName ?? 'T')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tags = post.hashtags ?? [];
  const isOwn = Boolean(me.data && author && me.data.id === author.id);
  const showFollow = interactive && Boolean(author) && !isOwn && !author?.isFollowing;
  /**
   * Talep paylaşımının kaynak talebi. Yalnızca `commerceRequestId` taşıyan
   * gönderiler teklif alabilir; talebi paylaşan kişiye buton gösterilmez.
   */
  /**
   * Teklif isteme, ilanı kopyalayan bir talep yaratmak yerine formu açar.
   * İlandan yalnızca nesnel alanlar taşınır (ürün, birim, marka, kategori);
   * miktarı ve teslim ayrıntısını alıcı kendi yazmalı, aksi halde satıcıya
   * kendi reklam metni talep olarak geri döner.
   */
  const askOfferHref = (() => {
    const params = new URLSearchParams();
    if (author?.username) params.set('magaza', author.username);
    if (deal?.categoryId) params.set('kategoriId', deal.categoryId);
    if (deal?.subcategoryId) params.set('altKategoriId', deal.subcategoryId);
    const product = deal?.productName ?? deal?.title;
    if (product) params.set('urun', product.slice(0, 120));
    if (deal?.unit) params.set('birim', deal.unit);
    if (deal?.brand) params.set('marka', deal.brand);
    return `/tedarik?${params.toString()}`;
  })();

  const offerRequestId = post.type === 'REQUEST_SHARE' ? (post.commerceRequestId ?? null) : null;
  const showOfferCta = interactive && Boolean(offerRequestId) && Boolean(me.data) && !isOwn;
  const body = post.body ?? '';
  const longBody = body.length > CAPTION_LIMIT;
  const caption = expanded || !longBody ? body : `${body.slice(0, CAPTION_LIMIT).trimEnd()}… `;

  function likeNow() {
    setBurst((value) => value + 1);
    if (!post.likedByMe && !like.isPending) like.mutate(post.id);
  }

  /** Çift tıklama beğenir; tek tıklama görseli olduğu gibi bırakır. */
  function onMediaTap() {
    if (!interactive) return;
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      lastTapRef.current = 0;
      likeNow();
      return;
    }
    lastTapRef.current = now;
  }

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
              <span
                className="text-info-500"
                title={t('offer.verifiedBadge')}
                aria-label={t('offer.verifiedBadge')}
              >
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
        ) : null}
      </header>

      {post.media.length > 0 ? (
        <div
          onPointerUp={onMediaTap}
          className={cn(
            'relative mt-3 grid select-none gap-0.5 bg-brand-950/5',
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
          {burst > 0 ? (
            <Heart
              key={burst}
              aria-hidden
              className="ig-heart-burst pointer-events-none absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow-[0_2px_12px_rgb(0_0_0_/_0.45)]"
            />
          ) : null}
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

      {showDealCta ? (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => router.push(askOfferHref)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white hover:bg-accent-600"
          >
            <ClipboardPlus className="size-4" />
            {t('social.askOffer')}
          </button>
        </div>
      ) : null}

      {showOfferCta ? (
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => router.push(`/tedarik/${offerRequestId}#teklif-ver`)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white hover:bg-accent-600"
          >
            <HandCoins className="size-4" />
            {t('social.giveOffer')}
          </button>
        </div>
      ) : null}

      {interactive ? (
        <div className="flex items-center gap-1 px-3 pt-2">
          <IconAction
            label={t('social.like')}
            active={post.likedByMe}
            disabled={like.isPending || unlike.isPending}
            onClick={() => (post.likedByMe ? unlike.mutate(post.id) : likeNow())}
          >
            <Heart className={cn('size-6', post.likedByMe && 'fill-danger-500 text-danger-500')} />
          </IconAction>
          <IconAction
            label={t('social.comment')}
            active={showComments}
            onClick={() => {
              setShowComments(true);
              commentInputRef.current?.focus();
            }}
          >
            <MessageCircle className="size-6" />
          </IconAction>
          <IconAction
            label={t('social.share')}
            active={post.sharedByMe}
            disabled={share.isPending}
            onClick={() => share.mutate(post.id)}
          >
            <Send className={cn('size-6', post.sharedByMe && 'text-info-500')} />
          </IconAction>
          <IconAction
            label={t('social.repost')}
            disabled={createPost.isPending}
            onClick={() => createPost.mutate({ originalPostId: post.originalPostId ?? post.id })}
          >
            <Repeat2 className="size-6" />
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
      ) : null}

      {post.likeCount > 0 ? (
        <p className="px-4 pt-1 text-[15px] font-semibold text-foreground">
          {t('social.likesCount', { count: post.likeCount })}
        </p>
      ) : null}

      {body || tags.length > 0 ? (
        <div className="px-4 pt-1 text-[15px] leading-relaxed">
          {author ? (
            <Link
              href={`/u/${author.username}`}
              className="mr-1.5 font-semibold text-foreground hover:underline"
            >
              {author.username}
            </Link>
          ) : null}
          <PostBody body={caption} />
          {longBody && !expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-foreground-muted hover:underline"
            >
              {t('social.captionMore')}
            </button>
          ) : null}
          {tags.length > 0 ? (
            <span className="block pt-0.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/gundem/${encodeURIComponent(tag)}`}
                  className="mr-1.5 text-info-500 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </span>
          ) : null}
        </div>
      ) : null}

      {interactive && post.commentCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          className="block px-4 pt-1 text-sm text-foreground-muted hover:underline"
        >
          {t('social.viewAllComments', { count: post.commentCount })}
        </button>
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
        <ul className="space-y-2.5 px-4 pt-2">
          {comments.isPending ? (
            <li className="text-sm text-foreground-muted">…</li>
          ) : comments.data?.items.length ? (
            comments.data.items.map((comment) => (
              <li
                key={comment.id}
                className="group/comment flex items-start gap-2.5 text-sm leading-relaxed"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-700 text-[10px] font-bold text-white">
                  {comment.author?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comment.author.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    (comment.author?.displayName ?? '?').slice(0, 1).toUpperCase()
                  )}
                </span>
                <p className="min-w-0 flex-1">
                  <Link
                    href={comment.author ? `/u/${comment.author.username}` : '#'}
                    className="mr-1.5 font-semibold text-foreground hover:underline"
                  >
                    {comment.author?.username ?? comment.author?.displayName ?? '—'}
                  </Link>
                  <span className="whitespace-pre-line text-foreground">{comment.body}</span>
                </p>
                <button
                  type="button"
                  className="shrink-0 text-xs text-foreground-muted opacity-0 transition-opacity hover:underline group-hover/comment:opacity-100"
                  onClick={() => setReportTarget({ type: 'COMMENT', id: comment.id })}
                >
                  {t('social.report')}
                </button>
              </li>
            ))
          ) : (
            <li className="text-sm text-foreground-muted">{t('social.commentEmpty')}</li>
          )}
        </ul>
      ) : null}

      {interactive ? (
        <form
          className="mt-2 flex items-center gap-2 border-t border-border/70 px-4 py-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            const value = commentBody.trim();
            if (!value) return;
            createComment.mutate(
              { body: value },
              {
                onSuccess: () => {
                  setCommentBody('');
                  setShowComments(true);
                },
              },
            );
          }}
        >
          <input
            ref={commentInputRef}
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder={t('social.addComment')}
            className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-foreground-muted"
          />
          <button
            type="submit"
            disabled={createComment.isPending || commentBody.trim().length === 0}
            className="shrink-0 text-sm font-semibold text-info-500 disabled:opacity-40"
          >
            {t('social.sendComment')}
          </button>
        </form>
      ) : (
        <div className="h-4" />
      )}
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
