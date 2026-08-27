import type { SocialPost } from '@talpio/types';

/**
 * Sosyal önbelleklerin yerinde güncellenmesi. Beğeni, kaydetme, takip gibi tek
 * noktaya dokunan etkileşimlerden sonra akış / keşfet / profil sorgularını
 * baştan çekmek yerine ilgili düğüm yamalanır. Aynı yardımcılar hem SSE
 * olaylarında hem de iyimser mutasyonlarda kullanılır; web ve mobil tek
 * kopyayı paylaşır.
 *
 * Sözleşme: **değişiklik yoksa `undefined`**. TanStack Query `setQueryData`
 * çağrısında `undefined` dönen güncelleyiciyi tamamen atlar, dolayısıyla hedefi
 * taşımayan önbellekler ne yazılır ne de yeniden render tetikler. Bu sayede tek
 * bir `['social']` ön ekiyle bütün sosyal sorgular taranabilir.
 *
 * Desteklenen önbellek şekilleri:
 * - `SocialFeedPage` → `{ items: FeedItem[] }`, gönderi `item.post` altında
 * - `Paginated<SocialPost>` / `{ items: SocialPost[] }` → gönderi doğrudan eleman
 * - `Paginated<SocialProfile>` → takipçi / takip edilen listeleri
 * - `SocialPost` ve `SocialProfile` → tek kayıt tutan detay sorguları
 * - Yukarıdakilerin içindeki `originalPost` (repost / alıntı) sarmalayıcıları
 */

/** Sunucudan gelen kesin sayaç ve bayrak değerleri. */
export interface SocialPostCounters {
  likeCount?: number;
  commentCount?: number;
  saveCount?: number;
  shareCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  sharedByMe?: boolean;
}

/** Kullanıcının kendi etkileşimi; bayrak ile sayaç birlikte hareket eder. */
export type SocialPostInteraction =
  | { kind: 'like' | 'save' | 'share'; active: boolean }
  | { kind: 'comment'; delta: number };

const INTERACTION_FIELDS = {
  like: { flag: 'likedByMe', count: 'likeCount' },
  save: { flag: 'savedByMe', count: 'saveCount' },
  share: { flag: 'sharedByMe', count: 'shareCount' },
} as const;

type Node = Record<string, unknown>;
type Change = (post: Node) => Node | undefined;

function isNode(value: unknown): value is Node {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Yalnızca gerçekten farklı olan alanları yazar; hiçbiri farklı değilse `undefined`. */
function withChanges(node: Node, changes: Record<string, unknown>): Node | undefined {
  let changed = false;
  const next: Node = { ...node };
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || next[key] === value) continue;
    next[key] = value;
    changed = true;
  }
  return changed ? next : undefined;
}

/** Sayaç alanı yoksa dokunulmaz; negatife düşmez. */
function bumpCount(value: unknown, delta: number): number | undefined {
  return typeof value === 'number' ? Math.max(0, value + delta) : undefined;
}

/** Gönderi düğümünü kimliğe göre bulur, repost sarmalayıcılarının içine iner. */
function patchPostNode(node: unknown, postId: string, change: Change): Node | undefined {
  if (!isNode(node)) return undefined;
  if (node.id === postId) return change(node);
  const originalPost = patchPostNode(node.originalPost, postId, change);
  return originalPost ? { ...node, originalPost } : undefined;
}

/** Liste elemanı ya akış öğesidir (`{ post }`) ya da gönderinin kendisidir. */
function patchPostEntry(entry: unknown, postId: string, change: Change): Node | undefined {
  if (!isNode(entry)) return undefined;
  if (isNode(entry.post)) {
    const post = patchPostNode(entry.post, postId, change);
    return post ? { ...entry, post } : undefined;
  }
  return patchPostNode(entry, postId, change);
}

function patchItems(old: unknown, patchEntry: (entry: unknown) => Node | undefined): Node | undefined {
  if (!isNode(old) || !Array.isArray(old.items)) return undefined;
  let changed = false;
  const items = (old.items as unknown[]).map((entry) => {
    const next = patchEntry(entry);
    if (!next) return entry;
    changed = true;
    return next;
  });
  return changed ? { ...old, items } : undefined;
}

function patchPostCache(old: unknown, postId: string, change: Change): unknown {
  return (
    patchItems(old, (entry) => patchPostEntry(entry, postId, change)) ??
    patchPostNode(old, postId, change)
  );
}

/** Sunucunun bildirdiği sayaçları uygular; SSE `social.post.updated` bunu kullanır. */
export function patchSocialPostCounters(
  old: unknown,
  postId: string,
  counters: SocialPostCounters,
): unknown {
  return patchPostCache(old, postId, (post) => withChanges(post, { ...counters }));
}

/** Mutasyon yanıtındaki gönderiden yamalanacak alanları ayıklar. */
export function socialPostCountersOf(post: SocialPost): SocialPostCounters {
  return {
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    saveCount: post.saveCount,
    shareCount: post.shareCount,
    likedByMe: post.likedByMe,
    savedByMe: post.savedByMe,
    sharedByMe: post.sharedByMe,
  };
}

/**
 * İyimser etkileşim yaması. Hedef durum önbellekte zaten geçerliyse hiçbir şey
 * yapmaz; böylece aynı yama iki kez uygulandığında sayaç kaymaz.
 */
export function patchSocialPostInteraction(
  old: unknown,
  postId: string,
  interaction: SocialPostInteraction,
): unknown {
  return patchPostCache(old, postId, (post) => {
    if (interaction.kind === 'comment') {
      return withChanges(post, { commentCount: bumpCount(post.commentCount, interaction.delta) });
    }
    const { flag, count } = INTERACTION_FIELDS[interaction.kind];
    if ((post[flag] === true) === interaction.active) return undefined;
    return withChanges(post, {
      [flag]: interaction.active,
      [count]: bumpCount(post[count], interaction.active ? 1 : -1),
    });
  });
}

/**
 * Profil düğümünde takip bayrağı. Önbellekteki bayrak zaten hedef durumdaysa
 * dokunulmaz; bilinmeyen (`undefined`) bayrak "takip edilmiyor" sayılır, bu
 * yüzden emin olmadığımız bir durumda takipçi sayısı azaltılmaz.
 */
function patchFollowProfile(node: unknown, username: string, isFollowing: boolean): Node | undefined {
  if (!isNode(node) || node.username !== username) return undefined;
  if ((node.isFollowing === true) === isFollowing) return undefined;
  return withChanges(node, {
    isFollowing,
    followerCount: bumpCount(node.followerCount, isFollowing ? 1 : -1),
  });
}

/** Profilin kendisini, gönderi yazarını ve sarmalanmış gönderileri tarar. */
function patchFollowNode(node: unknown, username: string, isFollowing: boolean): Node | undefined {
  if (!isNode(node)) return undefined;

  const self = patchFollowProfile(node, username, isFollowing);
  if (self) return self;

  let next: Node | undefined;
  const author = patchFollowProfile(node.author, username, isFollowing);
  if (author) next = { ...node, author };
  const post = patchFollowNode(node.post, username, isFollowing);
  if (post) next = { ...(next ?? node), post };
  const originalPost = patchFollowNode(node.originalPost, username, isFollowing);
  if (originalPost) next = { ...(next ?? node), originalPost };
  return next;
}

/**
 * Takip bayrağını verilen kullanıcı adına ait **her** kopyada günceller: akış ve
 * keşfet önbelleklerindeki o yazara ait bütün gönderiler, profil kaydı ve
 * takipçi / takip edilen listeleri.
 */
export function patchSocialFollow(old: unknown, username: string, isFollowing: boolean): unknown {
  return (
    patchItems(old, (entry) => patchFollowNode(entry, username, isFollowing)) ??
    patchFollowNode(old, username, isFollowing)
  );
}
