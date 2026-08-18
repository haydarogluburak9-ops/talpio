'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeEvent, SocialPostUpdatedPayload } from '@talpio/types';
import { API_ROUTES, queryKeys } from '@talpio/config';

import { publicEnv } from '@/lib/env';

function streamUrl(watchPostIds: string[]): string {
  const base = `${publicEnv.apiUrl}${API_ROUTES.realtime.stream}`;
  if (watchPostIds.length === 0) return base;
  const params = new URLSearchParams({
    watchPosts: watchPostIds.slice(0, 40).join(','),
  });
  return `${base}?${params.toString()}`;
}

/**
 * SSE ile canlı sosyal senkron.
 * Web oturumu çerez taşır; EventSource same-origin istekte kimliği gönderir.
 */
export function useRealtimeSync(options?: { watchPostIds?: string[]; enabled?: boolean }) {
  const queryClient = useQueryClient();
  const watchPostIds = options?.watchPostIds ?? [];
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return;

    const source = new EventSource(streamUrl(watchPostIds), { withCredentials: true });

    const handle = (raw: MessageEvent<string>) => {
      let event: RealtimeEvent;
      try {
        event = JSON.parse(raw.data) as RealtimeEvent;
      } catch {
        return;
      }

      switch (event.type) {
        case 'social.feed.invalidate':
        case 'social.post.created':
          void queryClient.invalidateQueries({ queryKey: queryKeys.social.feed() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
          break;
        case 'social.stories.invalidate':
          void queryClient.invalidateQueries({ queryKey: queryKeys.social.stories() });
          break;
        case 'social.profile.invalidate': {
          const username = event.payload.authorUsername;
          if (typeof username === 'string') {
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.postsByUsername(username) });
          }
          break;
        }
        case 'social.post.updated': {
          const payload = event.payload as unknown as SocialPostUpdatedPayload;
          queryClient.setQueriesData({ queryKey: queryKeys.social.feed() }, (old: unknown) =>
            patchFeedPost(old, payload),
          );
          queryClient.setQueriesData({ queryKey: queryKeys.social.discover() }, (old: unknown) =>
            patchFeedPost(old, payload),
          );
          void queryClient.invalidateQueries({ queryKey: queryKeys.social.post(payload.postId) });
          break;
        }
        case 'notification.new':
          void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
          break;
        default:
          break;
      }
    };

    for (const type of [
      'social.feed.invalidate',
      'social.stories.invalidate',
      'social.profile.invalidate',
      'social.post.created',
      'social.post.updated',
      'notification.new',
    ]) {
      source.addEventListener(type, handle as EventListener);
    }

    source.onmessage = handle as (ev: MessageEvent) => void;

    return () => {
      source.close();
    };
  }, [enabled, queryClient, watchPostIds.join(',')]);
}

function patchFeedPost(old: unknown, payload: SocialPostUpdatedPayload): unknown {
  if (!old || typeof old !== 'object' || !('items' in old)) return old;
  const page = old as { items: Array<{ post?: { id: string; likeCount?: number; commentCount?: number } }> };
  return {
    ...page,
    items: page.items.map((item) => {
      if (!item.post || item.post.id !== payload.postId) return item;
      return {
        ...item,
        post: {
          ...item.post,
          ...(payload.likeCount !== undefined ? { likeCount: payload.likeCount } : {}),
          ...(payload.commentCount !== undefined ? { commentCount: payload.commentCount } : {}),
        },
      };
    }),
  };
}
