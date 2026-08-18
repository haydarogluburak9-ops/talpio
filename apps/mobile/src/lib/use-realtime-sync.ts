import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeEvent, SocialPostUpdatedPayload } from '@talpio/types';
import { API_ROUTES, queryKeys } from '@talpio/config';

import { env } from '@/lib/env';
import { tokenStore } from '@/lib/api';

async function consumeSse(
  url: string,
  token: string,
  onEvent: (event: RealtimeEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    signal,
  });
  if (!response.ok || !response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) {
      const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
      if (!dataLine) continue;
      try {
        onEvent(JSON.parse(dataLine.slice(5).trim()) as RealtimeEvent);
      } catch {
        // yut
      }
    }
  }
}

export function useRealtimeSync(options?: { watchPostIds?: string[]; enabled?: boolean }) {
  const queryClient = useQueryClient();
  const watchPostIds = options?.watchPostIds ?? [];
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    void (async () => {
      const token = await tokenStore.getAccessToken();
      if (!token) return;

      const params =
        watchPostIds.length > 0
          ? `?watchPosts=${encodeURIComponent(watchPostIds.slice(0, 40).join(','))}`
          : '';
      const url = `${env.apiUrl}${API_ROUTES.realtime.stream}${params}`;

      const apply = (event: RealtimeEvent) => {
        switch (event.type) {
          case 'social.feed.invalidate':
          case 'social.post.created':
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.feed() });
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
            break;
          case 'social.stories.invalidate':
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.stories() });
            break;
          case 'social.post.updated': {
            const payload = event.payload as unknown as SocialPostUpdatedPayload;
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.post(payload.postId) });
            void queryClient.invalidateQueries({ queryKey: queryKeys.social.feed() });
            break;
          }
          case 'notification.new':
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() });
            break;
          default:
            break;
        }
      };

      while (!controller.signal.aborted) {
        try {
          await consumeSse(url, token, apply, controller.signal);
        } catch {
          if (controller.signal.aborted) break;
          await new Promise((resolve) => setTimeout(resolve, 3_000));
        }
      }
    })();

    return () => controller.abort();
  }, [enabled, queryClient, watchPostIds.join(',')]);
}
