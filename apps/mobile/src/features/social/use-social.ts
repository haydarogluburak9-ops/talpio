import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';

import { apiClient } from '@/lib/api';

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

export function useTrending(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.trending(),
    queryFn: ({ signal }) => apiClient.social.getTrending({ limit: 8 }, signal),
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

function invalidateFeed(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.feed() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.discover() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.social.stories() });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.like(id),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.unlike(id),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useSavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.save(id),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useUnsavePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.unsave(id),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.share(id),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => apiClient.social.follow(username),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useReportContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      targetType: 'POST' | 'COMMENT' | 'PROFILE';
      targetId: string;
      reason: string;
    }) => apiClient.social.report(body),
    onSuccess: (_report, body) => {
      if (body.targetType === 'POST') {
        void apiClient.social.hide(body.targetId);
      }
      invalidateFeed(queryClient);
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { originalPostId?: string; body?: string; mediaFileIds?: string[]; type?: 'IMAGE' | 'MULTI_IMAGE' }) =>
      apiClient.social.createPost(body),
    onSuccess: () => invalidateFeed(queryClient),
  });
}

export function useStories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.stories(),
    queryFn: ({ signal }) => apiClient.social.listStories(signal),
    enabled,
    staleTime: 30_000,
  });
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
    },
  });
}

export function useDeleteExperience(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.deleteExperience(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
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
    },
  });
}

export function useDeleteEducation(username: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.social.deleteEducation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.social.profile(username) });
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

export function useProfilePosts(username: string) {
  return useQuery({
    queryKey: queryKeys.social.postsByUsername(username),
    queryFn: ({ signal }) => apiClient.social.listPostsByUsername(username, { limit: 20 }, signal),
    enabled: username.length > 0,
  });
}

export function useFollowingList(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.social.following(username),
    queryFn: ({ signal }) => apiClient.social.listFollowing(username, { limit: 50 }, signal),
    enabled: enabled && username.length > 0,
  });
}
