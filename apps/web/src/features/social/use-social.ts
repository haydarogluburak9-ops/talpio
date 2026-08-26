'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateCommentBody,
  CreatePostBody,
  CreateRequestFromPostBody,
  ShareRequestToFeedBody,
} from '@talpio/api-client';
import { queryKeys } from '@talpio/config';

import { apiClient } from '@/lib/api';

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useFollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.social.follow(username),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useUnfollow(username: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.social.unfollow(username),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => apiClient.social.like(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => apiClient.social.unlike(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => apiClient.social.save(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useUnsavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => apiClient.social.unsave(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.comments(postId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.social.share(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useHidePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => apiClient.social.hide(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
    },
  });
}

export function useReportContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { targetType: 'POST' | 'COMMENT' | 'PROFILE'; targetId: string; reason: string }) =>
      apiClient.social.report(body),
    onSuccess: (_report, body) => {
      if (body.targetType === 'POST') {
        void apiClient.social.hide(body.targetId);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.all() });
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
