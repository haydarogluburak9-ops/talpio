'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeEvent, SocialPostUpdatedPayload } from '@talpio/types';
import { patchSocialPostCounters } from '@talpio/api-client';
import { API_ROUTES, queryKeys } from '@talpio/config';

import { publicEnv } from '@/lib/env';

function streamUrl(watchPosts: string): string {
  const base = `${publicEnv.apiUrl}${API_ROUTES.realtime.stream}`;
  if (watchPosts.length === 0) return base;
  return `${base}?${new URLSearchParams({ watchPosts }).toString()}`;
}

/**
 * SSE ile canlı sosyal senkron.
 * Web oturumu çerez taşır; EventSource same-origin istekte kimliği gönderir.
 */
export function useRealtimeSync(options?: { watchPostIds?: string[]; enabled?: boolean }) {
  const queryClient = useQueryClient();
  const enabled = options?.enabled ?? true;
  // Dizi kimliği her render'da değişir; akış yalnızca izlenen gönderi listesi
  // gerçekten farklılaştığında yeniden kurulsun diye tek dizeye indirilir.
  const watchPosts = (options?.watchPostIds ?? []).slice(0, 40).join(',');

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return;

    const source = new EventSource(streamUrl(watchPosts), { withCredentials: true });

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
          const { postId, ...counters } = event.payload as unknown as SocialPostUpdatedPayload;
          // Sunucu sayaçları kesin olduğu için iyimser yamanın üzerine yazılır;
          // gönderiyi taşımayan sorgular `undefined` alıp hiç dokunulmaz.
          queryClient.setQueriesData({ queryKey: queryKeys.social.all() }, (old: unknown) =>
            patchSocialPostCounters(old, postId, counters),
          );
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
  }, [enabled, queryClient, watchPosts]);
}
