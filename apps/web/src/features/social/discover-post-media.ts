import type { SocialPost } from '@talpio/types';

export function getDiscoverPostThumbnail(post: SocialPost): string | null {
  const file = post.media[0];
  if (!file) return null;
  return file.thumbnailUrl ?? file.url ?? null;
}

export function isDiscoverPostVideo(post: SocialPost): boolean {
  const file = post.media[0];
  return Boolean(file?.mimeType.startsWith('video/'));
}

export function getDiscoverPostPreview(post: SocialPost): string {
  const body = post.body?.trim();
  if (body) return body.slice(0, 80);
  if (post.deal?.title) return post.deal.title;
  if (post.promo?.label) return post.promo.label;
  return post.author?.displayName ?? post.author?.username ?? '';
}
