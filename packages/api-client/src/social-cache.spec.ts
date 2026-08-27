import {
  patchSocialFollow,
  patchSocialPostCounters,
  patchSocialPostInteraction,
} from './social-cache';

function feedPage(posts: Array<Record<string, unknown>>) {
  return {
    items: posts.map((post, index) => ({ id: `feed-${index}`, post })),
    meta: { nextCursor: null, hasNextPage: false },
  };
}

const post = (overrides: Record<string, unknown> = {}) => ({
  id: 'post-1',
  likeCount: 4,
  commentCount: 2,
  saveCount: 1,
  likedByMe: false,
  savedByMe: false,
  author: { username: 'usta', followerCount: 10, isFollowing: false },
  ...overrides,
});

describe('patchSocialPostInteraction', () => {
  it('beğeni bayrağını ve sayacını akış sayfasında günceller', () => {
    const patched = patchSocialPostInteraction(feedPage([post()]), 'post-1', {
      kind: 'like',
      active: true,
    }) as { items: Array<{ post: { likeCount: number; likedByMe: boolean } }> };

    expect(patched.items[0]?.post.likeCount).toBe(5);
    expect(patched.items[0]?.post.likedByMe).toBe(true);
  });

  it('gönderi taşımayan önbellek için undefined döner', () => {
    expect(
      patchSocialPostInteraction(feedPage([post({ id: 'other' })]), 'post-1', {
        kind: 'like',
        active: true,
      }),
    ).toBeUndefined();
    expect(patchSocialPostInteraction(undefined, 'post-1', { kind: 'like', active: true })).toBeUndefined();
  });

  it('hedef durum zaten geçerliyse sayacı ikinci kez kaydırmaz', () => {
    expect(
      patchSocialPostInteraction(feedPage([post({ likedByMe: true })]), 'post-1', {
        kind: 'like',
        active: true,
      }),
    ).toBeUndefined();
  });

  it('sayaç sıfırın altına düşmez', () => {
    const patched = patchSocialPostInteraction(
      feedPage([post({ likeCount: 0, likedByMe: true })]),
      'post-1',
      { kind: 'like', active: false },
    ) as { items: Array<{ post: { likeCount: number } }> };

    expect(patched.items[0]?.post.likeCount).toBe(0);
  });

  it('düz gönderi listesini ve repost sarmalayıcısını da tarar', () => {
    const saved = { items: [post()] } as unknown;
    const patchedSaved = patchSocialPostInteraction(saved, 'post-1', {
      kind: 'save',
      active: true,
    }) as { items: Array<{ savedByMe: boolean; saveCount: number }> };
    expect(patchedSaved.items[0]?.savedByMe).toBe(true);
    expect(patchedSaved.items[0]?.saveCount).toBe(2);

    const repost = feedPage([post({ id: 'repost-1', originalPost: post() })]);
    const patchedRepost = patchSocialPostInteraction(repost, 'post-1', {
      kind: 'like',
      active: true,
    }) as { items: Array<{ post: { originalPost: { likeCount: number } } }> };
    expect(patchedRepost.items[0]?.post.originalPost.likeCount).toBe(5);
  });

  it('yorum sayacını verilen delta kadar arttırır', () => {
    const patched = patchSocialPostInteraction(feedPage([post()]), 'post-1', {
      kind: 'comment',
      delta: 1,
    }) as { items: Array<{ post: { commentCount: number } }> };

    expect(patched.items[0]?.post.commentCount).toBe(3);
  });
});

describe('patchSocialPostCounters', () => {
  it('sunucudan gelen kesin sayaçları yazar, verilmeyen alanlara dokunmaz', () => {
    const patched = patchSocialPostCounters(feedPage([post()]), 'post-1', { likeCount: 9 }) as {
      items: Array<{ post: { likeCount: number; commentCount: number } }>;
    };

    expect(patched.items[0]?.post.likeCount).toBe(9);
    expect(patched.items[0]?.post.commentCount).toBe(2);
  });

  it('değer aynıysa önbelleği hiç yazmaz', () => {
    expect(patchSocialPostCounters(feedPage([post()]), 'post-1', { likeCount: 4 })).toBeUndefined();
  });
});

describe('patchSocialFollow', () => {
  it('yazara ait bütün gönderilerde takip bayrağını günceller', () => {
    const page = feedPage([post({ id: 'a' }), post({ id: 'b' }), post({ id: 'c', author: { username: 'başka', followerCount: 3, isFollowing: false } })]);
    const patched = patchSocialFollow(page, 'usta', true) as {
      items: Array<{ post: { author: { isFollowing: boolean; followerCount: number } } }>;
    };

    expect(patched.items[0]?.post.author.isFollowing).toBe(true);
    expect(patched.items[0]?.post.author.followerCount).toBe(11);
    expect(patched.items[1]?.post.author.isFollowing).toBe(true);
    expect(patched.items[2]?.post.author.isFollowing).toBe(false);
  });

  it('profil kaydının kendisini günceller', () => {
    const profile = { id: 'p1', username: 'usta', followerCount: 10, isFollowing: false };
    const patched = patchSocialFollow(profile, 'usta', true) as {
      isFollowing: boolean;
      followerCount: number;
    };

    expect(patched.isFollowing).toBe(true);
    expect(patched.followerCount).toBe(11);
  });

  it('bayrak bilinmiyorken takipçi sayısını azaltmaz', () => {
    const profile = { id: 'p1', username: 'usta', followerCount: 10 };
    expect(patchSocialFollow(profile, 'usta', false)).toBeUndefined();
  });

  it('ilgisiz kullanıcı için undefined döner', () => {
    expect(patchSocialFollow(feedPage([post()]), 'kimse', true)).toBeUndefined();
  });
});
