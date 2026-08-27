'use client';

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  patchSocialFollow,
  patchSocialPostCounters,
  patchSocialPostInteraction,
  socialPostCountersOf,
  type CreateCommentBody,
  type CreatePostBody,
  type CreateRequestFromPostBody,
  type ShareRequestToFeedBody,
} from '@talpio/api-client';
import { queryKeys } from '@talpio/config';
import type { SocialPost, SocialProfile } from '@talpio/types';

import { apiClient } from '@/lib/api';

/** İyimser yamada dokunulan sorguların önceki verisi; `onError` bunu geri yazar. */
type SocialCacheSnapshot = [readonly unknown[], unknown][];

/**
 * Yamayı `['social']` altındaki bütün sorgulara dener ama yalnızca hedefi
 * gerçekten taşıyanlara yazar: yama fonksiyonu değişiklik olmayan önbellek için
 * `undefined` döner ve TanStack Query o sorguya hiç dokunmaz. Dönen anlık kopya
 * yalnızca yazılan anahtarları içerir.
 */
function applySocialPatch(
  queryClient: QueryClient,
  patch: (old: unknown) => unknown,
): SocialCacheSnapshot {
  const snapshot: SocialCacheSnapshot = [];
  for (const [queryKey, data] of queryClient.getQueriesData({ queryKey: queryKeys.social.all() })) {
    const next = patch(data);
    if (next === undefined) continue;
    snapshot.push([queryKey, data]);
    queryClient.setQueryData(queryKey, next);
  }
  return snapshot;
}

/**
 * İyimser yamanın başlangıcı. Aynı kaydı taşıyan ve uçuşta olan tazelemeler
 * iptal edilir; yoksa geç gelen yanıt yamayı ezer ve düğme durumu geri seker.
 */
async function beginSocialPatch(
  queryClient: QueryClient,
  patch: (old: unknown) => unknown,
): Promise<SocialCacheSnapshot> {
  await queryClient.cancelQueries({
    queryKey: queryKeys.social.all(),
    predicate: (query) =>
      query.state.fetchStatus === 'fetching' && patch(query.state.data) !== undefined,
  });
  return applySocialPatch(queryClient, patch);
}

/** Sunucu reddederse arayüzün yalan söylememesi için önceki durumu geri yükler. */
function rollbackSocialPatch(queryClient: QueryClient, snapshot?: SocialCacheSnapshot): void {
  for (const [queryKey, data] of snapshot ?? []) {
    queryClient.setQueryData(queryKey, data);
  }
}

/**
 * Beğeni / kaydetme / paylaşma mutasyonlarının ortak iskeleti: iyimser yama,
 * hatada geri alma, yanıttaki kesin sayaçlarla uzlaşma. Bu üç işlem yalnızca
 * kendi gönderisini etkilediği için hiçbir listeyi yeniden çekmez.
 */
function usePostInteraction(
  interaction: { kind: 'like' | 'save' | 'share'; active: boolean },
  run: (postId: string) => Promise<SocialPost>,
  settle?: (queryClient: QueryClient) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: run,
    onMutate: (postId: string) =>
      beginSocialPatch(queryClient, (old) => patchSocialPostInteraction(old, postId, interaction)),
    onError: (_error, _postId, snapshot) => rollbackSocialPatch(queryClient, snapshot),
    onSuccess: (post, postId) => {
      applySocialPatch(queryClient, (old) =>
        patchSocialPostCounters(old, postId, socialPostCountersOf(post)),
      );
      settle?.(queryClient);
    },
  });
}

/** Kaydedilenler listesi yalnızca kaydetme/kaldırma ile değişir. */
function settleSaved(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.saved() });
}

/**
 * Takipten gerçekten etkilenenler: akış ve hikâye içeriği, kendi profil
 * sayaçlarım, hedefin takipçi listesi ve kendi takip listem. Hedef profilin
 * kendisi yanıttan yazıldığı için çekilmez; keşfet listesi de bilerek dışarıda
 * bırakılır (öneri kartının kısa süre listede kalması buna bağlı).
 */
function settleFollow(queryClient: QueryClient, username: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.feed() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.stories() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.followers(username) });
  const me = queryClient.getQueryData<SocialProfile>(queryKeys.social.me());
  if (me) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.social.following(me.username) });
  }
}

/** Akışa yeni içerik giren ya da çıkan mutasyonların ortak geçersiz kılması. */
function settleFeedContent(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.feed() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
}

export function useSocialMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.me(),
    queryFn: ({ signal }) => apiClient.social.getMe(signal),
    enabled,
  });
}

export function useUpdateSocialProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof apiClient.social.updateMe>[0]) =>
      apiClient.social.updateMe(body),
    onSuccess: (profile) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(profile.username) });
      // Ad / avatar bütün yazar kartlarında görünür.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.social.postsByUsername(profile.username),
      });
      settleFeedContent(queryClient);
    },
  });
}

export function useCreateExperience(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof apiClient.social.createExperience>[0]) =>
      apiClient.social.createExperience(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useUpdateExperience(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof apiClient.social.updateExperience>[1];
    }) => apiClient.social.updateExperience(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useDeleteExperience(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.deleteExperience(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useCreateEducation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof apiClient.social.createEducation>[0]) =>
      apiClient.social.createEducation(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useUpdateEducation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof apiClient.social.updateEducation>[1];
    }) => apiClient.social.updateEducation(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useDeleteEducation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.deleteEducation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useCreateSkill(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof apiClient.social.createSkill>[0]) =>
      apiClient.social.createSkill(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useDeleteSkill(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.deleteSkill(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
    },
  });
}

export function useSocialProfile(username: string) {
  return useQuery({
    queryKey: queryKeys.social.profile(username),
    queryFn: ({ signal }) => apiClient.social.getProfile(username, signal),
    enabled: username.length > 0,
  });
}

export function useSocialFeed(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.feed(),
    queryFn: ({ signal }) => apiClient.social.getFeed({ limit: 30 }, signal),
    enabled,
  });
}

export function useDiscoverFeed(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.discover(),
    queryFn: ({ signal }) => apiClient.social.getDiscover({ limit: 30 }, signal),
    enabled,
  });
}

export function useCategoryFollows(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.categoryFollows(),
    queryFn: ({ signal }) => apiClient.social.listCategoryFollows(signal),
    enabled,
  });
}

export function useFollowCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => apiClient.social.followCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.categoryFollows() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
    },
  });
}

export function useUnfollowCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => apiClient.social.unfollowCategory(categoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.categoryFollows() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
    },
  });
}

export function useReplaceInterests() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryIds: string[]) => apiClient.social.replaceInterests(categoryIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.categoryFollows() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
    },
  });
}

export function useSocialAnalytics(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.analyticsMe(),
    queryFn: ({ signal }) => apiClient.social.getAnalyticsMe(signal),
    enabled,
  });
}

export function useProfilePosts(username: string, tab = 'posts') {
  return useQuery({
    queryKey: queryKeys.social.postsByUsername(username, { tab }),
    queryFn: ({ signal }) =>
      apiClient.social.listPostsByUsername(username, { limit: 30, tab }, signal),
    enabled:
      username.length > 0 &&
      !['about', 'followers', 'following', 'reviews', 'saved', 'settings'].includes(tab),
  });
}

export function useSavedPosts(enabled = false) {
  return useQuery({
    queryKey: queryKeys.social.saved(),
    queryFn: ({ signal }) => apiClient.social.listSaved({ limit: 30 }, signal),
    enabled,
  });
}

/** Kişi arama; iki harften kısa sorgular sunucuya gitmez. */
export function useSearchProfiles(query: string) {
  const needle = query.trim();
  return useQuery({
    queryKey: queryKeys.social.profileSearch(needle),
    queryFn: ({ signal }) => apiClient.social.searchProfiles({ q: needle, limit: 20 }, signal),
    enabled: needle.length >= 2,
    staleTime: 30_000,
  });
}

export function useMessageProfile(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.social.messageProfile(username),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.all() });
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePostBody) => apiClient.social.createPost(body),
    onSuccess: (post) => {
      settleFeedContent(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.stories() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.trending() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.me() });
      const username = post.author?.username;
      if (username) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.social.postsByUsername(username),
        });
      }
    },
  });
}

export function useFollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.social.follow(username),
    onMutate: () => beginSocialPatch(queryClient, (old) => patchSocialFollow(old, username, true)),
    onError: (_error, _variables, snapshot) => rollbackSocialPatch(queryClient, snapshot),
    onSuccess: (profile) => {
      // Yanıt, profil uç noktasının döndürdüğü şeklin aynısı ve `isFollowing`
      // alanını izleyiciye göre taşır; ayrıca çekmeye gerek yok.
      queryClient.setQueryData(queryKeys.social.profile(username), profile);
      settleFollow(queryClient, username);
    },
  });
}

export function useUnfollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.social.unfollow(username),
    onMutate: () => beginSocialPatch(queryClient, (old) => patchSocialFollow(old, username, false)),
    onError: (_error, _variables, snapshot) => rollbackSocialPatch(queryClient, snapshot),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.social.profile(username), profile);
      settleFollow(queryClient, username);
    },
  });
}

export function useLikePost() {
  return usePostInteraction({ kind: 'like', active: true }, (postId) =>
    apiClient.social.like(postId),
  );
}

export function useUnlikePost() {
  return usePostInteraction({ kind: 'like', active: false }, (postId) =>
    apiClient.social.unlike(postId),
  );
}

export function useSavePost() {
  return usePostInteraction(
    { kind: 'save', active: true },
    (postId) => apiClient.social.save(postId),
    settleSaved,
  );
}

export function useUnsavePost() {
  return usePostInteraction(
    { kind: 'save', active: false },
    (postId) => apiClient.social.unsave(postId),
    settleSaved,
  );
}

export function usePostComments(postId: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.social.comments(postId),
    queryFn: ({ signal }) => apiClient.social.listComments(postId, { limit: 50 }, signal),
    enabled: enabled && postId.length > 0,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCommentBody) => apiClient.social.comment(postId, body),
    // Yorum sayacı kartta anında artar; listeyi yalnızca ilgili gönderi çeker.
    onMutate: () =>
      beginSocialPatch(queryClient, (old) =>
        patchSocialPostInteraction(old, postId, { kind: 'comment', delta: 1 }),
      ),
    onError: (_error, _body, snapshot) => rollbackSocialPatch(queryClient, snapshot),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.comments(postId) });
    },
  });
}

export function useCreateRequestFromPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      body,
    }: {
      postId: string;
      body?: CreateRequestFromPostBody;
    }) => apiClient.social.createRequestFromPost(postId, body ?? {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all() });
    },
  });
}

export function useShareRequestToFeed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      body,
    }: {
      requestId: string;
      body?: ShareRequestToFeedBody;
    }) => apiClient.social.shareRequest(requestId, body ?? {}),
    onSuccess: () => settleFeedContent(queryClient),
  });
}

export function useSharePost() {
  return usePostInteraction({ kind: 'share', active: true }, (postId) =>
    apiClient.social.share(postId),
  );
}

export function useHidePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.social.hide(postId),
    onSuccess: () => settleFeedContent(queryClient),
  });
}

export function useReportContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetType: 'POST' | 'COMMENT' | 'PROFILE'; targetId: string; reason: string }) =>
      apiClient.social.report(body),
    onSuccess: async (_report, body) => {
      if (body.targetType !== 'POST') return;
      // Gizleme tamamlanmadan çekilen akış, şikâyet edilen gönderiyi geri getirir.
      await apiClient.social.hide(body.targetId);
      settleFeedContent(queryClient);
    },
  });
}

export function useRecordPostView() {
  return useMutation({
    mutationFn: (postId: string) => apiClient.social.recordView(postId),
  });
}

export function useTrending(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.trending(),
    queryFn: ({ signal }) => apiClient.social.getTrending({ limit: 8 }, signal),
    enabled,
  });
}

export function useHashtagPosts(slug: string) {
  return useQuery({
    queryKey: queryKeys.social.hashtagPosts(slug),
    queryFn: ({ signal }) => apiClient.social.listHashtagPosts(slug, { limit: 30 }, signal),
    enabled: slug.length > 0,
  });
}

export function useFollowers(username: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.social.followers(username),
    // Arama yüklü kayıtlar üzerinde çalıştığı için sayfa boyu geniş tutulur.
    queryFn: ({ signal }) => apiClient.social.listFollowers(username, { limit: 100 }, signal),
    enabled: enabled && username.length > 0,
  });
}

export function useFollowingList(username: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.social.following(username),
    queryFn: ({ signal }) => apiClient.social.listFollowing(username, { limit: 100 }, signal),
    enabled: enabled && username.length > 0,
  });
}
