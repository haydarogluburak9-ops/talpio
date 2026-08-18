/**
 * Sunucu → istemci canlı olay sözleşmesi (SSE).
 * Web ve mobil aynı tipleri kullanır.
 */

export const REALTIME_EVENT_TYPES = [
  'social.feed.invalidate',
  'social.stories.invalidate',
  'social.profile.invalidate',
  'social.post.created',
  'social.post.updated',
  'notification.new',
] as const;

export type RealtimeEventType = (typeof REALTIME_EVENT_TYPES)[number];

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: Record<string, unknown>;
  at: string;
}

export interface SocialPostUpdatedPayload {
  postId: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  saveCount?: number;
}

export interface SocialProfileInvalidatePayload {
  username: string;
}

export interface SocialPostCreatedPayload {
  postId: string;
  authorProfileId: string;
  authorUsername?: string;
}

export interface NotificationNewPayload {
  notificationId?: string;
  unreadCount?: number;
}
