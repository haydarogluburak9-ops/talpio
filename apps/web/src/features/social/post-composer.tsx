'use client';

import { DEFAULT_CURRENCY, UPLOAD, minorUnitFactor } from '@talpio/config';
import { ApiError } from '@talpio/api-client';
import { Button, cn } from '@talpio/ui';
import { BadgePercent, ImagePlus, SendHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useCategories } from '@/features/catalog/use-categories';
import { MediaUploader } from '@/features/files/media-uploader';
import { useSession } from '@/features/auth/use-session';
import { useMyBusinesses } from '@/features/requests/use-requests';
import { categoryName, t } from '@/lib/i18n';

import { useCreatePost, useSocialMe } from './use-social';

function majorToMinor(value: string, currency: string): number | undefined {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return undefined;
  const major = Number(normalized);
  if (!Number.isFinite(major) || major < 0) return undefined;
  return Math.round(major * minorUnitFactor(currency));
}

type BusinessRow = {
  id: string;
  name: string;
  localeSettings?: { defaultCurrency?: string | null } | null;
  socialProfile?: { username?: string | null } | null;
};

export function PostComposer({
  expand,
  onExpandConsumed,
  onPublished,
}: {
  expand?: 'media' | 'promo' | 'story' | null;
  onExpandConsumed?: () => void;
  onPublished?: () => void;
} = {}) {
  const session = useSession();
  const me = useSocialMe(Boolean(session.data));
  const businesses = useMyBusinesses(Boolean(session.data));
  const categories = useCategories();
  const businessList = (businesses.data as BusinessRow[] | undefined) ?? [];
  const [businessId, setBusinessId] = useState<string>('');
  const [body, setBody] = useState('');
  const [mediaFileIds, setMediaFileIds] = useState<string[]>([]);
  const [showMedia, setShowMedia] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [storyMode, setStoryMode] = useState(false);
  const [promoLabel, setPromoLabel] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [promoValidUntil, setPromoValidUntil] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [locationText, setLocationText] = useState('');
  const [shippingIncluded, setShippingIncluded] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [mediaPickerNonce, setMediaPickerNonce] = useState(0);
  const createPost = useCreatePost();

  const selectedBusiness =
    businessList.find((b) => b.id === businessId) ?? businessList[0] ?? null;
  const effectiveBusinessId = selectedBusiness?.id;
  const currency =
    selectedBusiness?.localeSettings?.defaultCurrency?.toUpperCase() || DEFAULT_CURRENCY;

  useEffect(() => {
    if (!businessId && businessList[0]?.id) {
      setBusinessId(businessList[0].id);
    }
  }, [businessId, businessList]);

  useEffect(() => {
    if (expand === 'media') setShowMedia(true);
    if (expand === 'promo') setShowPromo(true);
    if (expand === 'story') {
      setStoryMode(true);
      setShowMedia(true);
      setShowPromo(false);
    }
    if (expand) {
      document.getElementById('social-composer')?.focus();
      onExpandConsumed?.();
    }
  }, [expand, onExpandConsumed]);

  const canSubmit =
    (body.trim().length > 0 || mediaFileIds.length > 0 || showPromo) && !createPost.isPending;

  const initials =
    (me.data?.displayName ?? session.data?.fullName ?? 'T')
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'TP';

  function reset() {
    setBody('');
    setMediaFileIds([]);
    setShowMedia(false);
    setShowPromo(false);
    setStoryMode(false);
    setPromoLabel('');
    setOriginalPrice('');
    setPromoPrice('');
    setPromoValidUntil('');
    setCategoryId('');
    setLocationText('');
    setShippingIncluded(null);
    setFormError(null);
  }

  return (
    <form
      className="social-panel social-composer overflow-hidden"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        setFormError(null);

        const originalPriceMinor = majorToMinor(originalPrice, currency);
        const promoPriceMinor = majorToMinor(promoPrice, currency);
        const hasPromo =
          showPromo &&
          (promoLabel.trim().length > 0 ||
            originalPriceMinor !== undefined ||
            promoPriceMinor !== undefined);

        if (storyMode && mediaFileIds.length === 0) {
          setFormError(t('social.storyNeedsMedia'));
          return;
        }

        if (hasPromo) {
          if (!locationText.trim()) {
            setFormError(t('social.locationRequired'));
            return;
          }
          if (shippingIncluded == null) {
            setFormError(t('social.shippingRequired'));
            return;
          }
          if (!categoryId) {
            setFormError(t('social.categoryRequired'));
            return;
          }
        }

        createPost.mutate(
          {
            body: body.trim() || undefined,
            mediaFileIds: mediaFileIds.length > 0 ? mediaFileIds : undefined,
            ...(storyMode
              ? { type: mediaFileIds.length > 1 ? ('MULTI_IMAGE' as const) : ('IMAGE' as const) }
              : {}),
            ...(effectiveBusinessId ? { businessId: effectiveBusinessId } : {}),
            ...(hasPromo
              ? {
                  type: 'DEAL' as const,
                  deal: {
                    title: promoLabel.trim() || undefined,
                    listPriceMinor: originalPriceMinor,
                    dealPriceMinor: promoPriceMinor,
                    currency,
                    endsAt: promoValidUntil
                      ? new Date(promoValidUntil).toISOString()
                      : undefined,
                    categoryId,
                    locationText: locationText.trim(),
                    shippingIncluded,
                  },
                  promoLabel: promoLabel.trim() || undefined,
                  originalPriceMinor,
                  promoPriceMinor,
                  promoCurrency: currency,
                  promoValidUntil: promoValidUntil
                    ? new Date(promoValidUntil).toISOString()
                    : undefined,
                }
              : {}),
          },
          {
            onSuccess: () => {
              reset();
              onPublished?.();
            },
            onError: (error) => {
              setFormError(
                error instanceof ApiError ? error.message : t('social.publishFailed'),
              );
            },
          },
        );
      }}
    >
      {businessList.length > 0 ? (
        <div className="border-b border-border/70 px-4 py-2">
          <label className="flex items-center gap-2 text-xs font-medium text-foreground-muted">
            <span>{t('social.postAsStore')}</span>
            <select
              value={effectiveBusinessId ?? ''}
              onChange={(event) => setBusinessId(event.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-sm text-foreground outline-none focus:border-accent-500"
            >
              {businessList.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                  {business.socialProfile?.username
                    ? ` (@${business.socialProfile.username})`
                    : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <div className="flex gap-3 p-4">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-xs font-bold text-white">
          {me.data?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.data.avatarUrl} alt="" className="size-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="social-composer">
            {t('social.composerPlaceholder')}
          </label>
          <textarea
            id="social-composer"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={
              storyMode ? t('social.storyComposerPlaceholder') : t('social.composerPrompt')
            }
            rows={2}
            className="w-full resize-none rounded-2xl border border-transparent bg-surface-muted/90 px-4 py-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-brand-200 focus:bg-surface dark:focus:border-brand-700"
          />
        </div>
      </div>

      {storyMode ? (
        <p className="border-t border-border/70 px-4 py-2 text-xs text-foreground-muted">
          {t('social.storyHint')}
        </p>
      ) : null}

      {showMedia ? (
        <div className="border-t border-border/70 px-4 py-3">
          <MediaUploader
            value={mediaFileIds}
            onChange={setMediaFileIds}
            max={UPLOAD.maxPostMedia}
            openPickerNonce={mediaPickerNonce}
          />
        </div>
      ) : null}

      {showPromo ? (
        <div className="grid gap-3 border-t border-border/70 bg-accent-50/40 px-4 py-3 sm:grid-cols-2 dark:bg-accent-900/10">
          <p className="sm:col-span-2 text-sm text-foreground-muted">{t('social.promoHint')}</p>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-foreground-muted">{t('social.promoLabel')}</span>
            <input
              value={promoLabel}
              onChange={(event) => setPromoLabel(event.target.value)}
              placeholder={t('social.promoLabelPlaceholder')}
              maxLength={120}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground-muted">{t('social.originalPrice')}</span>
            <input
              inputMode="decimal"
              value={originalPrice}
              onChange={(event) => setOriginalPrice(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground-muted">{t('social.promoPrice')}</span>
            <input
              inputMode="decimal"
              value={promoPrice}
              onChange={(event) => setPromoPrice(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground-muted">{t('social.promoValidUntil')}</span>
            <input
              type="date"
              value={promoValidUntil}
              onChange={(event) => setPromoValidUntil(event.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground-muted">{t('social.dealCategory')}</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent-500"
            >
              <option value="">{t('common.selectPlaceholder')}</option>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {categoryName(category)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-foreground-muted">{t('social.dealLocation')}</span>
            <input
              value={locationText}
              onChange={(event) => setLocationText(event.target.value)}
              placeholder={t('social.dealLocationPlaceholder')}
              maxLength={200}
              required
              className="rounded-lg border border-border bg-surface px-3 py-2 outline-none focus:border-accent-500"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium text-foreground-muted">
              {t('social.shippingIncluded')}
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShippingIncluded(true)}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium',
                  shippingIncluded === true
                    ? 'bg-brand-900 text-white'
                    : 'bg-surface-muted text-foreground-muted',
                )}
              >
                {t('social.shippingIncludedYes')}
              </button>
              <button
                type="button"
                onClick={() => setShippingIncluded(false)}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium',
                  shippingIncluded === false
                    ? 'bg-brand-900 text-white'
                    : 'bg-surface-muted text-foreground-muted',
                )}
              >
                {t('social.shippingIncludedNo')}
              </button>
            </div>
          </fieldset>
          {formError && showPromo ? (
            <p className="sm:col-span-2 text-sm text-danger-500">{formError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-3 py-2">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => {
              setShowMedia(true);
              setMediaPickerNonce((value) => value + 1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-sm font-semibold text-success-700 hover:bg-success-50/80',
              showMedia && 'ring-2 ring-success-500/30',
            )}
          >
            <ImagePlus className="size-4 text-success-600" aria-hidden />
            {t('social.addMedia')}
          </button>
          {storyMode ? null : (
            <button
              type="button"
              onClick={() => setShowPromo((value) => !value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-sm font-semibold text-accent-700 hover:bg-accent-100',
                showPromo && 'ring-2 ring-accent-500/30',
              )}
            >
              <BadgePercent className="size-4 text-accent-600" aria-hidden />
              {t('social.addPromo')}
            </button>
          )}
        </div>
        {formError && !showPromo ? (
          <p className="w-full text-sm text-danger-500 sm:w-auto">{formError}</p>
        ) : null}
        <Button
          type="submit"
          size="sm"
          disabled={!canSubmit}
          className="gap-1.5 bg-accent-500 font-semibold tracking-wide text-white hover:bg-accent-600"
        >
          <SendHorizontal className="size-4" aria-hidden />
          {createPost.isPending
            ? t('social.publishing')
            : storyMode
              ? t('social.addStory')
              : t('social.publish')}
        </Button>
      </div>
    </form>
  );
}
