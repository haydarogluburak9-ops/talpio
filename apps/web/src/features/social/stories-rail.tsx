'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

import { useCompose } from './compose-context';
import { useHighlightPicker } from './profile-highlights';
import { groupStories, StoryViewer } from './story-viewer';
import { useSocialMe } from './use-social';

export function StoriesRail() {
  const session = useSession();
  const me = useSocialMe(Boolean(session.data));
  const { openCompose } = useCompose();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const stories = useQuery({
    queryKey: [...queryKeys.social.all(), 'stories'],
    queryFn: ({ signal }) => apiClient.social.listStories(signal),
    enabled: Boolean(session.data),
    staleTime: 30_000,
  });

  const groups = useMemo(
    () => groupStories(stories.data?.items ?? [], me.data?.id),
    [stories.data?.items, me.data?.id],
  );
  const ownUsername = me.data?.username ?? '';
  const highlightPicker = useHighlightPicker(ownUsername);

  if (!session.data) return null;

  return (
    <>
      <div className="social-panel overflow-hidden px-3 py-4">
        <p className="mb-3 px-1 text-xs font-semibold tracking-[0.14em] text-foreground-muted uppercase">
          {t('social.storiesTitle')}
        </p>
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          <div className="relative flex w-[4.6rem] shrink-0 flex-col items-center gap-1.5">
            <button
              type="button"
              aria-label={t('social.yourStory')}
              onClick={() => {
                const mine = groups.findIndex((group) => group.author.id === me.data?.id);
                if (mine >= 0) setOpenIndex(mine);
                else openCompose('story');
              }}
              className="flex w-full flex-col items-center gap-1.5"
            >
              <span
                className={
                  groups.some((group) => group.author.id === me.data?.id)
                    ? 'story-ring story-ring-hot relative grid size-[4.25rem] place-items-center rounded-full'
                    : 'relative grid size-[4.25rem] place-items-center rounded-full bg-surface-muted'
                }
              >
                {me.data?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={me.data.avatarUrl}
                    alt=""
                    className="size-[3.55rem] rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold text-brand-800">
                    {(me.data?.displayName ?? 'T').slice(0, 1)}
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-center text-[11px] leading-tight font-semibold text-foreground">
                {t('social.yourStory')}
              </span>
            </button>
            <button
              type="button"
              aria-label={t('social.addStory')}
              onClick={() => openCompose('story')}
              className="absolute right-0 bottom-[1.35rem] grid size-6 place-items-center rounded-full bg-accent-500 text-white ring-2 ring-surface"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {groups
            .map((group, index) => ({ group, index }))
            .filter(({ group }) => group.author.id !== me.data?.id)
            .map(({ group, index }) => {
            const preview = group.posts[group.posts.length - 1]?.media[0]?.url;
            return (
              <button
                key={group.author.id}
                type="button"
                onClick={() => setOpenIndex(index)}
                className="flex w-[4.6rem] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="story-ring story-ring-hot grid size-[4.25rem] place-items-center rounded-full">
                  <span className="grid size-[3.55rem] place-items-center overflow-hidden rounded-full bg-surface-muted">
                    {preview || group.author.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={group.author.avatarUrl ?? preview}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-brand-800">
                        {group.author.displayName.slice(0, 1)}
                      </span>
                    )}
                  </span>
                </span>
                <span className="line-clamp-2 text-center text-[11px] leading-tight font-semibold text-foreground">
                  {group.author.displayName}
                </span>
              </button>
            );
          })}
        </div>
        {groups.length === 0 && !stories.isPending ? (
          <div className="mt-2 px-1">
            <p className="text-xs text-foreground-muted">{t('social.storiesEmpty')}</p>
            <a href="/kesfet" className="mt-1 inline-block text-xs font-medium text-accent-600 hover:underline">
              {t('social.storiesEmptyCta')}
            </a>
          </div>
        ) : null}
      </div>

      {openIndex != null && groups[openIndex] ? (
        <StoryViewer
          key={openIndex}
          groups={groups}
          startGroup={openIndex}
          onClose={() => setOpenIndex(null)}
          onAddToHighlight={
            groups[openIndex]?.author.id === me.data?.id
              ? (postId) => {
                  void highlightPicker.create.mutateAsync({
                    title: t('social.newHighlight'),
                    postId,
                  });
                }
              : undefined
          }
          highlights={
            groups[openIndex]?.author.id === me.data?.id
              ? highlightPicker.highlights.data?.items
              : undefined
          }
          onPickHighlight={
            groups[openIndex]?.author.id === me.data?.id
              ? (highlightId, postId) => {
                  void highlightPicker.addItem.mutateAsync({ highlightId, postId });
                }
              : undefined
          }
        />
      ) : null}
    </>
  );
}
