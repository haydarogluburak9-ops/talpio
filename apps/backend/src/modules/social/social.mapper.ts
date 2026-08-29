import { DEFAULT_CURRENCY } from '@talpio/config';

import type { Prisma } from '@/generated/prisma/client';
import type {
  DealMetadata,
  FeedItem,
  FileAsset,
  SocialPost,
  SocialPostComment,
  SocialPostPromo,
  SocialProfile,
  SocialProfileEducation,
  SocialProfileExperience,
  SocialProfileSkill,
  StoryHighlight,
} from '@talpio/types';

export const socialProfileSelect = {
  id: true,
  kind: true,
  userId: true,
  businessId: true,
  username: true,
  displayName: true,
  headline: true,
  bio: true,
  avatarFileId: true,
  coverFileId: true,
  locationCityId: true,
  locationText: true,
  followerCount: true,
  followingCount: true,
  postCount: true,
  isVerifiedDisplay: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  avatar: {
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      sizeBytes: true,
      originalName: true,
      isPublic: true,
      createdAt: true,
    },
  },
  cover: {
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      sizeBytes: true,
      originalName: true,
      isPublic: true,
      createdAt: true,
    },
  },
} satisfies Prisma.SocialProfileSelect;

export type SocialProfileRow = Prisma.SocialProfileGetPayload<{
  select: typeof socialProfileSelect;
}>;

export const profileCareerOrder = {
  experiences: {
    orderBy: [
      { isCurrent: 'desc' as const },
      { startYear: 'desc' as const },
      { sortOrder: 'asc' as const },
    ],
  },
  education: {
    orderBy: [
      { isCurrent: 'desc' as const },
      { startYear: 'desc' as const },
      { sortOrder: 'asc' as const },
    ],
  },
} satisfies Pick<Prisma.SocialProfileInclude, 'experiences' | 'education'>;

export type SocialProfileExperienceRow = {
  id: string;
  profileId: string;
  company: string;
  title: string;
  locationText: string | null;
  description: string | null;
  startYear: number;
  startMonth: number | null;
  endYear: number | null;
  endMonth: number | null;
  isCurrent: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SocialProfileEducationRow = {
  id: string;
  profileId: string;
  school: string;
  degree: string | null;
  fieldOfStudy: string | null;
  description: string | null;
  startYear: number;
  startMonth: number | null;
  endYear: number | null;
  endMonth: number | null;
  isCurrent: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type SocialProfileSkillRow = {
  id: string;
  profileId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export function toSocialProfileExperience(
  row: SocialProfileExperienceRow,
): SocialProfileExperience {
  return {
    id: row.id,
    profileId: row.profileId,
    company: row.company,
    title: row.title,
    locationText: row.locationText,
    description: row.description,
    startYear: row.startYear,
    startMonth: row.startMonth,
    endYear: row.endYear,
    endMonth: row.endMonth,
    isCurrent: row.isCurrent,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: null,
  };
}

export function toSocialProfileEducation(row: SocialProfileEducationRow): SocialProfileEducation {
  return {
    id: row.id,
    profileId: row.profileId,
    school: row.school,
    degree: row.degree,
    fieldOfStudy: row.fieldOfStudy,
    description: row.description,
    startYear: row.startYear,
    startMonth: row.startMonth,
    endYear: row.endYear,
    endMonth: row.endMonth,
    isCurrent: row.isCurrent,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: null,
  };
}

export function toSocialProfileSkill(row: SocialProfileSkillRow): SocialProfileSkill {
  return {
    id: row.id,
    profileId: row.profileId,
    name: row.name,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const dealMetadataSelect = {
  id: true,
  productName: true,
  title: true,
  listPriceMinor: true,
  dealPriceMinor: true,
  discountPercent: true,
  currency: true,
  unit: true,
  minQuantity: true,
  stockQuantity: true,
  startsAt: true,
  endsAt: true,
  vatIncluded: true,
  shippingIncluded: true,
  locationText: true,
  categoryId: true,
  subcategoryId: true,
  brand: true,
  maxQuantity: true,
  deliveryRegions: true,
} satisfies Prisma.DealMetadataSelect;

export const postInclude = {
  author: { select: socialProfileSelect },
  dealMetadata: { select: dealMetadataSelect },
  hashtags: { include: { hashtag: { select: { slug: true, display: true } } } },
  mentions: { include: { profile: { select: { username: true, displayName: true } } } },
  originalPost: {
    include: {
      author: { select: socialProfileSelect },
      dealMetadata: { select: dealMetadataSelect },
      media: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          file: {
            select: {
              id: true,
              storageKey: true,
              mimeType: true,
              sizeBytes: true,
              originalName: true,
              isPublic: true,
              createdAt: true,
              metadata: true,
            },
          },
        },
      },
    },
  },
  media: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      file: {
        select: {
          id: true,
          storageKey: true,
          mimeType: true,
          sizeBytes: true,
          originalName: true,
          isPublic: true,
          createdAt: true,
        },
      },
    },
  },
} satisfies Prisma.PostInclude;

export type PostRow = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export const commentInclude = {
  author: { select: socialProfileSelect },
} satisfies Prisma.PostCommentInclude;

export type CommentRow = Prisma.PostCommentGetPayload<{ include: typeof commentInclude }>;

export const feedItemInclude = {
  post: { include: postInclude },
} satisfies Prisma.FeedItemInclude;

export type FeedItemRow = Prisma.FeedItemGetPayload<{ include: typeof feedItemInclude }>;

export function resolveAssetUrl(fileBaseUrl: string, storageKey: string): string {
  if (/^https?:\/\//i.test(storageKey)) return storageKey;
  return `${fileBaseUrl}/${storageKey}`;
}

export function toFileAsset(
  file: {
    id: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    originalName: string | null;
    isPublic: boolean;
    createdAt: Date;
    metadata?: unknown;
  },
  fileBaseUrl: string,
): FileAsset {
  const meta = file.metadata as { thumbStorageKey?: string } | null | undefined;
  const thumbnailUrl = meta?.thumbStorageKey
    ? resolveAssetUrl(fileBaseUrl, meta.thumbStorageKey)
    : null;
  return {
    id: file.id,
    url: resolveAssetUrl(fileBaseUrl, file.storageKey),
    thumbnailUrl,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    originalName: file.originalName,
    isPublic: file.isPublic,
    createdAt: file.createdAt.toISOString(),
  };
}

export function toSocialProfile(
  row: SocialProfileRow,
  fileBaseUrl: string,
  extras: {
    isFollowing?: boolean;
    business?: SocialProfile['business'];
    experiences?: SocialProfileExperience[];
    education?: SocialProfileEducation[];
    skills?: SocialProfileSkill[];
  } = {},
): SocialProfile {
  return {
    id: row.id,
    kind: row.kind,
    userId: row.userId,
    businessId: row.businessId,
    username: row.username,
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    avatarUrl: row.avatar ? resolveAssetUrl(fileBaseUrl, row.avatar.storageKey) : null,
    coverUrl: row.cover ? resolveAssetUrl(fileBaseUrl, row.cover.storageKey) : null,
    locationCityId: row.locationCityId,
    locationText: row.locationText,
    followerCount: row.followerCount,
    followingCount: row.followingCount,
    postCount: row.postCount,
    isVerifiedDisplay: row.isVerifiedDisplay,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    ...(extras.isFollowing !== undefined ? { isFollowing: extras.isFollowing } : {}),
    ...(extras.business !== undefined ? { business: extras.business } : {}),
    ...(extras.experiences !== undefined ? { experiences: extras.experiences } : {}),
    ...(extras.education !== undefined ? { education: extras.education } : {}),
    ...(extras.skills !== undefined ? { skills: extras.skills } : {}),
  };
}

function toDealMetadata(row: NonNullable<PostRow['dealMetadata']>): DealMetadata {
  return {
    productName: row.productName,
    title: row.title,
    listPriceMinor: row.listPriceMinor,
    dealPriceMinor: row.dealPriceMinor,
    discountPercent: row.discountPercent,
    currency: row.currency,
    unit: row.unit,
    minQuantity: row.minQuantity,
    stockQuantity: row.stockQuantity,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    vatIncluded: row.vatIncluded,
    shippingIncluded: row.shippingIncluded,
    locationText: row.locationText,
    categoryId: row.categoryId,
    subcategoryId: row.subcategoryId,
    brand: row.brand,
    maxQuantity: row.maxQuantity,
    deliveryRegions: Array.isArray(row.deliveryRegions) ? (row.deliveryRegions as string[]) : [],
  };
}

function toPromoFromRow(row: PostRow): SocialPostPromo | null {
  const deal = row.dealMetadata;
  const hasLegacy =
    row.promoLabel != null || row.promoPriceMinor != null || row.originalPriceMinor != null;

  if (!deal && !hasLegacy) return null;

  return {
    label: deal?.title ?? deal?.productName ?? row.promoLabel,
    originalPriceMinor: deal?.listPriceMinor ?? row.originalPriceMinor,
    promoPriceMinor: deal?.dealPriceMinor ?? row.promoPriceMinor,
    // Yalnızca para birimi hiç yazılmamış eski promo kayıtları için; yeni
    // gönderilerde yazarın para birimi kayıt anında belirlenir.
    currency: deal?.currency ?? row.promoCurrency ?? DEFAULT_CURRENCY,
    validUntil: (deal?.endsAt ?? row.promoValidUntil)?.toISOString() ?? null,
  };
}

/**
 * İzleyicinin takip ettiği profil id kümesi verilmişse yazar kaydına
 * `isFollowing` iliştirir. Küme yoksa (anonim izleyici) bayrak hiç eklenmez.
 */
function viewerFollowExtras(
  profileId: string,
  followedProfileIds?: ReadonlySet<string>,
): { isFollowing?: boolean } {
  if (!followedProfileIds) return {};
  return { isFollowing: followedProfileIds.has(profileId) };
}

export function toSocialPost(
  row: PostRow,
  fileBaseUrl: string,
  extras: {
    likedByMe?: boolean;
    savedByMe?: boolean;
    sharedByMe?: boolean;
    followedProfileIds?: ReadonlySet<string>;
  } = {},
): SocialPost {
  const original = row.originalPost
    ? toSocialPost(
        {
          ...row.originalPost,
          originalPost: null,
          hashtags: [],
          mentions: [],
        },
        fileBaseUrl,
        { followedProfileIds: extras.followedProfileIds },
      )
    : null;

  return {
    id: row.id,
    authorProfileId: row.authorProfileId,
    type: row.type,
    body: row.body,
    visibility: row.visibility,
    likeCount: row.likeCount,
    commentCount: row.commentCount,
    saveCount: row.saveCount,
    viewCount: row.viewCount,
    uniqueViewCount: row.uniqueViewCount,
    shareCount: row.shareCount,
    repostCount: row.repostCount,
    originalPostId: row.originalPostId,
    originalPost: original,
    hashtags: (row.hashtags ?? []).map((item) => item.hashtag.slug),
    mentions: (row.mentions ?? []).map((item) => ({
      username: item.profile.username,
      displayName: item.profile.displayName,
    })),
    commerceRequestId: row.commerceRequestId,
    promo: toPromoFromRow(row),
    deal: row.dealMetadata ? toDealMetadata(row.dealMetadata) : null,
    media: (row.media ?? []).map((m) => toFileAsset(m.file, fileBaseUrl)),
    author: row.author
      ? toSocialProfile(
          row.author,
          fileBaseUrl,
          viewerFollowExtras(row.author.id, extras.followedProfileIds),
        )
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    ...(extras.likedByMe !== undefined ? { likedByMe: extras.likedByMe } : {}),
    ...(extras.savedByMe !== undefined ? { savedByMe: extras.savedByMe } : {}),
    ...(extras.sharedByMe !== undefined ? { sharedByMe: extras.sharedByMe } : {}),
  };
}

export function toSocialComment(row: CommentRow, fileBaseUrl: string): SocialPostComment {
  return {
    id: row.id,
    postId: row.postId,
    authorProfileId: row.authorProfileId,
    parentId: row.parentId,
    body: row.body,
    likeCount: row.likeCount,
    author: row.author ? toSocialProfile(row.author, fileBaseUrl) : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

export function toFeedItem(
  row: FeedItemRow,
  fileBaseUrl: string,
  extras: {
    likedByMe?: boolean;
    savedByMe?: boolean;
    sharedByMe?: boolean;
    score?: number;
    followedProfileIds?: ReadonlySet<string>;
  } = {},
): FeedItem {
  return {
    id: row.id,
    kind: row.kind,
    postId: row.postId,
    commerceRequestId: row.commerceRequestId,
    authorProfileId: row.authorProfileId,
    score: extras.score ?? row.score,
    createdAt: row.createdAt.toISOString(),
    post: row.post && !row.post.deletedAt ? toSocialPost(row.post, fileBaseUrl, extras) : null,
  };
}

type HighlightRow = {
  id: string;
  profileId: string;
  title: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  cover?: { storageKey: string; isPublic: boolean } | null;
  _count: { items: number };
  items?: Array<{
    post?: {
      media?: Array<{ file: { storageKey: string; isPublic: boolean } }>;
    };
  }>;
};

export function toStoryHighlight(row: HighlightRow, fileBaseUrl: string): StoryHighlight {
  let coverUrl: string | null = null;
  if (row.cover?.isPublic) {
    coverUrl = resolveAssetUrl(fileBaseUrl, row.cover.storageKey);
  } else {
    const firstMedia = row.items?.[0]?.post?.media?.[0]?.file;
    if (firstMedia?.isPublic) {
      coverUrl = resolveAssetUrl(fileBaseUrl, firstMedia.storageKey);
    }
  }

  return {
    id: row.id,
    profileId: row.profileId,
    title: row.title,
    coverUrl,
    itemCount: row._count.items,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
