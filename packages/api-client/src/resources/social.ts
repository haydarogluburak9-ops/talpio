import { API_ROUTES } from '@talpio/config';
import type {
  CategoryFollow,
  CommerceRequest,
  ContentReport,
  ContentReportTarget,
  Conversation,
  DealMetadata,
  FeedItem,
  PostType,
  SocialAnalyticsSummary,
  SocialPost,
  SocialPostComment,
  SocialProfile,
  StoryHighlight,
  StoryHighlightDetail,
  TrendingTopic,
} from '@talpio/types';

import type { HttpClient, Paginated } from '../http-client';

export type CreateDealBody = Partial<DealMetadata> & {
  currency?: string;
};

export interface CreatePostBody {
  type?: PostType;
  /** Mağaza profilinden paylaşım için işletme kimliği */
  businessId?: string;
  body?: string;
  mediaFileIds?: string[];
  commerceRequestId?: string;
  promoLabel?: string;
  originalPriceMinor?: number;
  promoPriceMinor?: number;
  promoCurrency?: string;
  promoValidUntil?: string;
  deal?: CreateDealBody;
  originalPostId?: string;
}

export interface CreateRequestFromPostBody {
  publish?: boolean;
  title?: string;
  description?: string;
}

export interface ShareRequestToFeedBody {
  body?: string;
}

export interface UpdateSocialProfileBody {
  displayName?: string;
  bio?: string | null;
  username?: string;
  locationCityId?: string | null;
  locationText?: string | null;
  avatarFileId?: string | null;
  coverFileId?: string | null;
}

export interface CreateCommentBody {
  body: string;
  parentId?: string;
}

export interface CreateReportBody {
  targetType: ContentReportTarget;
  targetId: string;
  reason: string;
}

export interface FeedCursorMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface SocialFeedPage {
  items: FeedItem[];
  meta: FeedCursorMeta;
}

export interface CreateStoryHighlightBody {
  title: string;
  postId?: string;
  coverFileId?: string;
}

export interface UpdateStoryHighlightBody {
  title?: string;
  coverFileId?: string | null;
  sortOrder?: number;
}

export interface AddStoryHighlightItemBody {
  postId: string;
}

export function createSocialResource(http: HttpClient) {
  return {
    getMe(signal?: AbortSignal): Promise<SocialProfile> {
      return http.get<SocialProfile>(API_ROUTES.social.me, { ...(signal ? { signal } : {}) });
    },

    updateMe(body: UpdateSocialProfileBody): Promise<SocialProfile> {
      return http.patch<SocialProfile>(API_ROUTES.social.me, body);
    },

    checkUsernameAvailability(
      username: string,
      signal?: AbortSignal,
    ): Promise<{ available: boolean; username: string }> {
      return http.get<{ available: boolean; username: string }>(
        API_ROUTES.social.usernameAvailability(username),
        { ...(signal ? { signal } : {}) },
      );
    },

    getProfile(username: string, signal?: AbortSignal): Promise<SocialProfile> {
      return http.get<SocialProfile>(API_ROUTES.social.profileByUsername(username), {
        ...(signal ? { signal } : {}),
      });
    },

    follow(username: string): Promise<SocialProfile> {
      return http.post<SocialProfile>(API_ROUTES.social.follow(username));
    },

    messageProfile(username: string): Promise<Conversation> {
      return http.post<Conversation>(API_ROUTES.social.message(username));
    },

    unfollow(username: string): Promise<SocialProfile> {
      return http.delete<SocialProfile>(API_ROUTES.social.follow(username));
    },

    listFollowers(
      username: string,
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SocialProfile>> {
      return http.paginated<SocialProfile>(API_ROUTES.social.followers(username), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listFollowing(
      username: string,
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SocialProfile>> {
      return http.paginated<SocialProfile>(API_ROUTES.social.following(username), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listPostsByUsername(
      username: string,
      params: { page?: number; limit?: number; tab?: string } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SocialPost>> {
      return http.paginated<SocialPost>(API_ROUTES.social.postsByUsername(username), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    createPost(body: CreatePostBody): Promise<SocialPost> {
      return http.post<SocialPost>(API_ROUTES.social.posts, body);
    },

    getPost(id: string, signal?: AbortSignal): Promise<SocialPost> {
      return http.get<SocialPost>(API_ROUTES.social.postById(id), {
        ...(signal ? { signal } : {}),
      });
    },

    deletePost(id: string): Promise<void> {
      return http.delete<void>(API_ROUTES.social.postById(id));
    },

    createRequestFromPost(
      postId: string,
      body: CreateRequestFromPostBody = {},
    ): Promise<CommerceRequest> {
      return http.post<CommerceRequest>(API_ROUTES.social.createRequestFromPost(postId), body);
    },

    shareRequest(requestId: string, body: ShareRequestToFeedBody = {}): Promise<SocialPost> {
      return http.post<SocialPost>(API_ROUTES.social.shareRequest(requestId), body);
    },

    like(id: string): Promise<SocialPost> {
      return http.post<SocialPost>(API_ROUTES.social.like(id));
    },

    unlike(id: string): Promise<SocialPost> {
      return http.delete<SocialPost>(API_ROUTES.social.like(id));
    },

    comment(id: string, body: CreateCommentBody): Promise<SocialPostComment> {
      return http.post<SocialPostComment>(API_ROUTES.social.comments(id), body);
    },

    listComments(
      id: string,
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SocialPostComment>> {
      return http.paginated<SocialPostComment>(API_ROUTES.social.comments(id), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    save(id: string): Promise<SocialPost> {
      return http.post<SocialPost>(API_ROUTES.social.save(id));
    },

    unsave(id: string): Promise<SocialPost> {
      return http.delete<SocialPost>(API_ROUTES.social.save(id));
    },

    share(id: string): Promise<SocialPost> {
      return http.post<SocialPost>(API_ROUTES.social.share(id));
    },

    recordView(id: string): Promise<{ recorded: boolean }> {
      return http.post<{ recorded: boolean }>(API_ROUTES.social.view(id));
    },

    hide(id: string): Promise<{ ok: true }> {
      return http.post<{ ok: true }>(API_ROUTES.social.hide(id));
    },

    getTrending(
      params: { limit?: number; cityId?: string; categoryId?: string } = {},
      signal?: AbortSignal,
    ): Promise<TrendingTopic[]> {
      return http.get<TrendingTopic[]>(API_ROUTES.social.trending, {
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listHashtagPosts(
      slug: string,
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SocialPost>> {
      return http.paginated<SocialPost>(API_ROUTES.social.hashtagPosts(slug), {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    getFeed(
      params: { cursor?: string; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<SocialFeedPage> {
      return http.get<SocialFeedPage>(API_ROUTES.social.feed, {
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    getDiscover(
      params: { cursor?: string; limit?: number; categoryId?: string } = {},
      signal?: AbortSignal,
    ): Promise<SocialFeedPage> {
      return http.get<SocialFeedPage>(API_ROUTES.social.discover, {
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listCategoryFollows(signal?: AbortSignal): Promise<CategoryFollow[]> {
      return http.get<CategoryFollow[]>(API_ROUTES.social.categoryFollows, {
        ...(signal ? { signal } : {}),
      });
    },

    followCategory(categoryId: string): Promise<CategoryFollow> {
      return http.post<CategoryFollow>(API_ROUTES.social.categoryFollow(categoryId));
    },

    unfollowCategory(categoryId: string): Promise<CategoryFollow> {
      return http.delete<CategoryFollow>(API_ROUTES.social.categoryFollow(categoryId));
    },

    replaceInterests(categoryIds: string[]): Promise<CategoryFollow[]> {
      return http.put<CategoryFollow[]>(API_ROUTES.social.interests, { categoryIds });
    },

    getAnalyticsMe(signal?: AbortSignal): Promise<SocialAnalyticsSummary> {
      return http.get<SocialAnalyticsSummary>(API_ROUTES.social.analyticsMe, {
        ...(signal ? { signal } : {}),
      });
    },

    getAnalyticsBusiness(
      businessId: string,
      signal?: AbortSignal,
    ): Promise<SocialAnalyticsSummary> {
      return http.get<SocialAnalyticsSummary>(API_ROUTES.social.analyticsBusiness(businessId), {
        ...(signal ? { signal } : {}),
      });
    },

    report(body: CreateReportBody): Promise<ContentReport> {
      return http.post<ContentReport>(API_ROUTES.social.reports, body);
    },

    block(userId: string): Promise<void> {
      return http.post<void>(API_ROUTES.social.block(userId));
    },

    unblock(userId: string): Promise<void> {
      return http.delete<void>(API_ROUTES.social.block(userId));
    },

    listSaved(
      params: { page?: number; limit?: number } = {},
      signal?: AbortSignal,
    ): Promise<Paginated<SocialPost>> {
      return http.paginated<SocialPost>(API_ROUTES.social.saved, {
        method: 'GET',
        query: { ...params },
        ...(signal ? { signal } : {}),
      });
    },

    listStories(signal?: AbortSignal): Promise<{ items: SocialPost[]; comingSoon?: boolean }> {
      return http.get<{ items: SocialPost[]; comingSoon?: boolean }>(API_ROUTES.social.stories, {
        ...(signal ? { signal } : {}),
      });
    },

    listProfileStories(
      username: string,
      signal?: AbortSignal,
    ): Promise<{ items: SocialPost[] }> {
      return http.get<{ items: SocialPost[] }>(API_ROUTES.social.profileStories(username), {
        ...(signal ? { signal } : {}),
      });
    },

    listProfileHighlights(
      username: string,
      signal?: AbortSignal,
    ): Promise<{ items: StoryHighlight[] }> {
      return http.get<{ items: StoryHighlight[] }>(API_ROUTES.social.profileHighlights(username), {
        ...(signal ? { signal } : {}),
      });
    },

    getProfileHighlight(
      username: string,
      highlightId: string,
      signal?: AbortSignal,
    ): Promise<StoryHighlightDetail> {
      return http.get<StoryHighlightDetail>(
        API_ROUTES.social.profileHighlight(username, highlightId),
        { ...(signal ? { signal } : {}),
        },
      );
    },

    createHighlight(body: CreateStoryHighlightBody): Promise<StoryHighlightDetail> {
      return http.post<StoryHighlightDetail>(API_ROUTES.social.highlights, body);
    },

    updateHighlight(
      highlightId: string,
      body: UpdateStoryHighlightBody,
    ): Promise<StoryHighlightDetail> {
      return http.patch<StoryHighlightDetail>(API_ROUTES.social.highlightById(highlightId), body);
    },

    deleteHighlight(highlightId: string): Promise<void> {
      return http.delete<void>(API_ROUTES.social.highlightById(highlightId));
    },

    addHighlightItem(
      highlightId: string,
      body: AddStoryHighlightItemBody,
    ): Promise<StoryHighlightDetail> {
      return http.post<StoryHighlightDetail>(API_ROUTES.social.highlightItems(highlightId), body);
    },

    removeHighlightItem(highlightId: string, postId: string): Promise<StoryHighlightDetail> {
      return http.delete<StoryHighlightDetail>(
        API_ROUTES.social.highlightItem(highlightId, postId),
      );
    },

    listGroupConversations(
      signal?: AbortSignal,
    ): Promise<{ items: Conversation[]; comingSoon: false }> {
      return http.get<{ items: Conversation[]; comingSoon: false }>(
        API_ROUTES.social.groupConversations,
        { ...(signal ? { signal } : {}) },
      );
    },

    createGroupConversation(
      body: { title: string; memberIds: string[] },
      signal?: AbortSignal,
    ): Promise<Conversation> {
      return http.post<Conversation>(API_ROUTES.social.groupConversations, body, {
        ...(signal ? { signal } : {}),
      });
    },
  };
}

export type SocialResource = ReturnType<typeof createSocialResource>;
