import type { SocialPost, SocialProfile } from '@talpio/types';

export type StoryGroup = {
  author: SocialProfile;
  posts: SocialPost[];
};

export function groupStories(posts: SocialPost[], meId?: string): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const post of posts) {
    if (!post.author || post.media.length === 0) continue;
    const current = map.get(post.author.id);
    if (current) current.posts.push(post);
    else map.set(post.author.id, { author: post.author, posts: [post] });
  }

  return [...map.values()].sort((a, b) => {
    if (meId && a.author.id === meId) return -1;
    if (meId && b.author.id === meId) return 1;
    const aTime = new Date(a.posts[a.posts.length - 1]?.createdAt ?? 0).getTime();
    const bTime = new Date(b.posts[b.posts.length - 1]?.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}
