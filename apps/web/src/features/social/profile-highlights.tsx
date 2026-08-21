'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import type { SocialProfile, StoryHighlight } from '@talpio/types';
import { Button, cn } from '@talpio/ui';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useSession } from '@/features/auth/use-session';
import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

import { groupStories, StoryViewer, type StoryGroup } from './story-viewer';
import { useSocialMe } from './use-social';

type ViewerState =
  | { kind: 'active' }
  | { kind: 'highlight'; highlightId: string; title: string }
  | null;

export function ProfileHighlightsSection({
  profile,
  isOwn,
}: {
  profile: SocialProfile;
  isOwn: boolean;
}) {
  const session = useSession();
  const queryClient = useQueryClient();
  const [viewer, setViewer] = useState<ViewerState>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);

  const activeStories = useQuery({
    queryKey: queryKeys.social.profileStories(profile.username),
    queryFn: ({ signal }) => apiClient.social.listProfileStories(profile.username, signal),
    staleTime: 60_000,
  });

  const highlights = useQuery({
    queryKey: queryKeys.social.profileHighlights(profile.username),
    queryFn: ({ signal }) => apiClient.social.listProfileHighlights(profile.username, signal),
    staleTime: 60_000,
  });

  const highlightDetail = useQuery({
    queryKey:
      viewer?.kind === 'highlight'
        ? queryKeys.social.profileHighlight(profile.username, viewer.highlightId)
        : ['social', 'profile-highlight', 'idle'],
    queryFn: ({ signal }) => {
      if (viewer?.kind !== 'highlight') {
        throw new Error('Highlight viewer inactive');
      }
      return apiClient.social.getProfileHighlight(profile.username, viewer.highlightId, signal);
    },
    enabled: viewer?.kind === 'highlight',
  });

  const createHighlight = useMutation({
    mutationFn: (input: { title: string; postId?: string }) => apiClient.social.createHighlight(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.social.profileHighlights(profile.username),
      });
      setCreateOpen(false);
      setCreateTitle('');
      setPendingPostId(null);
    },
  });

  const addToHighlight = useMutation({
    mutationFn: (input: { highlightId: string; postId: string }) =>
      apiClient.social.addHighlightItem(input.highlightId, { postId: input.postId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.social.profileHighlights(profile.username),
      });
    },
  });

  const activeItems = activeStories.data?.items ?? [];
  const highlightItems = highlights.data?.items ?? [];
  const hasActive = activeItems.length > 0;
  const hasHighlights = highlightItems.length > 0;

  const viewerGroups: StoryGroup[] = useMemo(() => {
    if (viewer?.kind === 'active') {
      return groupStories(activeItems, profile.id);
    }
    if (viewer?.kind === 'highlight' && highlightDetail.data?.items.length) {
      return [{ author: profile, posts: highlightDetail.data.items }];
    }
    return [];
  }, [viewer, activeItems, highlightDetail.data?.items, profile]);

  if (!hasActive && !hasHighlights && !isOwn) return null;

  return (
    <>
      <div className="mt-4 border-t border-border/70 pt-4">
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {hasActive ? (
            <HighlightCircle
              title={isOwn ? t('social.yourStory') : t('social.storiesTitle')}
              coverUrl={profile.avatarUrl}
              ring
              onClick={() => setViewer({ kind: 'active' })}
            />
          ) : null}

          {highlightItems.map((item) => (
            <HighlightCircle
              key={item.id}
              title={item.title}
              coverUrl={item.coverUrl}
              onClick={() =>
                setViewer({ kind: 'highlight', highlightId: item.id, title: item.title })
              }
            />
          ))}

          {isOwn && session.data ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex w-[4.6rem] shrink-0 flex-col items-center gap-1.5"
            >
              <span className="grid size-[4.25rem] place-items-center rounded-full border-2 border-dashed border-border bg-surface-muted text-foreground-muted">
                <Plus className="size-6" />
              </span>
              <span className="line-clamp-2 text-center text-[11px] leading-tight font-semibold text-foreground-muted">
                {t('social.newHighlight')}
              </span>
            </button>
          ) : null}
        </div>

        {!hasActive && !hasHighlights && isOwn ? (
          <p className="mt-2 px-1 text-xs text-foreground-muted">{t('social.highlightEmpty')}</p>
        ) : null}
      </div>

      {viewer && viewerGroups.length > 0 ? (
        <StoryViewer
          groups={viewerGroups}
          startGroup={0}
          onClose={() => setViewer(null)}
          onAddToHighlight={
            isOwn && viewer.kind === 'active'
              ? (postId) => {
                  setPendingPostId(postId);
                  setCreateOpen(true);
                }
              : undefined
          }
          highlights={isOwn ? highlightItems : undefined}
          onPickHighlight={
            isOwn
              ? (highlightId, postId) => {
                  void addToHighlight.mutateAsync({ highlightId, postId });
                }
              : undefined
          }
        />
      ) : null}

      {createOpen ? (
        <HighlightCreateDialog
          title={createTitle}
          onTitleChange={setCreateTitle}
          pendingPostId={pendingPostId}
          existingHighlights={highlightItems}
          loading={createHighlight.isPending || addToHighlight.isPending}
          onClose={() => {
            setCreateOpen(false);
            setCreateTitle('');
            setPendingPostId(null);
          }}
          onCreate={(title) => {
            void createHighlight.mutateAsync({
              title,
              ...(pendingPostId ? { postId: pendingPostId } : {}),
            });
          }}
          onAddToExisting={(highlightId) => {
            if (!pendingPostId) return;
            void addToHighlight.mutateAsync({ highlightId, postId: pendingPostId });
            setCreateOpen(false);
            setPendingPostId(null);
          }}
        />
      ) : null}
    </>
  );
}

function HighlightCircle({
  title,
  coverUrl,
  ring,
  onClick,
}: {
  title: string;
  coverUrl?: string | null;
  ring?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="flex w-[4.6rem] shrink-0 flex-col items-center gap-1.5">
      <span
        className={cn(
          'relative grid size-[4.25rem] place-items-center rounded-full',
          ring ? 'story-ring story-ring-hot p-[3px]' : 'border border-border bg-surface-muted p-[3px]',
        )}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="size-full rounded-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
            {title.slice(0, 1)}
          </span>
        )}
      </span>
      <span className="line-clamp-2 w-full text-center text-[11px] leading-tight font-semibold text-foreground">
        {title}
      </span>
    </button>
  );
}

function HighlightCreateDialog({
  title,
  onTitleChange,
  pendingPostId,
  existingHighlights,
  loading,
  onClose,
  onCreate,
  onAddToExisting,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  pendingPostId: string | null;
  existingHighlights: StoryHighlight[];
  loading: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  onAddToExisting: (highlightId: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-brand-900 dark:text-foreground">
          {pendingPostId ? t('social.addToHighlight') : t('social.newHighlight')}
        </h2>

        {pendingPostId && existingHighlights.length > 0 ? (
          <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto">
            {existingHighlights.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2 text-left hover:bg-surface-muted"
                  onClick={() => onAddToExisting(item.id)}
                >
                  {item.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.coverUrl} alt="" className="size-10 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-full bg-brand-800 text-xs font-bold text-white">
                      {item.title.slice(0, 1)}
                    </span>
                  )}
                  <span className="font-medium">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-foreground-muted">
          {t('social.highlightName')}
          <input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-foreground"
            maxLength={50}
            placeholder={t('social.highlightName')}
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={loading || title.trim().length === 0}
            onClick={() => onCreate(title.trim())}
          >
            {t('social.createHighlight')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Story viewer'dan öne çıkarma için dışa açık hook. */
export function useHighlightPicker(username: string) {
  const queryClient = useQueryClient();
  const me = useSocialMe(true);

  const highlights = useQuery({
    queryKey: queryKeys.social.profileHighlights(username),
    queryFn: ({ signal }) => apiClient.social.listProfileHighlights(username, signal),
    enabled: Boolean(me.data?.username === username),
  });

  const addItem = useMutation({
    mutationFn: (input: { highlightId: string; postId: string }) =>
      apiClient.social.addHighlightItem(input.highlightId, { postId: input.postId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.social.profileHighlights(username),
      });
    },
  });

  const create = useMutation({
    mutationFn: (input: { title: string; postId: string }) => apiClient.social.createHighlight(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.social.profileHighlights(username),
      });
    },
  });

  return { highlights, addItem, create, isOwn: me.data?.username === username };
}
