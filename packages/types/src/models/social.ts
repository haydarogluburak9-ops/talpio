import type {
  ContentReportStatus,
  ContentReportTarget,
  FeedItemKind,
  PostType,
  PostVisibility,
  SocialProfileKind,
} from '../enums/social';
import type { BaseEntity, FileAsset } from './common';

export interface SocialBusinessCard {
  businessId: string;
  ownerUserId: string;
  providerProfileId?: string | null;
  isVerified: boolean;
  about?: string | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  serviceRegions: string[];
  rating?: number | null;
  reviewCount: number;
  responseRate?: number | null;
  averageResponseMinutes?: number | null;
  offerAcceptanceRate?: number | null;
  completedOrderCount: number;
  dealPostCount: number;
  campaignPostCount: number;
  portfolioPostCount: number;
  credentials: Array<{ type: string }>;
  /** Premium abonelikten bağımsız; yoksa henüz hesaplanmamıştır. */
  trustScore?: { score: number; computedAt: string } | null;
}

export interface SocialProfile extends BaseEntity {
  kind: SocialProfileKind;
  userId?: string | null;
  businessId?: string | null;
  username: string;
  displayName: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  locationCityId?: string | null;
  locationText?: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  /** Güven rozeti; premium abonelikten bağımsızdır. */
  isVerifiedDisplay: boolean;
  isFollowing?: boolean;
  experiences?: SocialProfileExperience[];
  education?: SocialProfileEducation[];
  /** Mağaza / işletme vitrini; yalnızca BUSINESS profillerde dolu. */
  business?: SocialBusinessCard | null;
}

export interface SocialProfileExperience extends BaseEntity {
  profileId: string;
  company: string;
  title: string;
  locationText?: string | null;
  description?: string | null;
  startYear: number;
  startMonth?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  isCurrent: boolean;
  sortOrder: number;
}

export interface SocialProfileEducation extends BaseEntity {
  profileId: string;
  school: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  description?: string | null;
  startYear: number;
  startMonth?: number | null;
  endYear?: number | null;
  endMonth?: number | null;
  isCurrent: boolean;
  sortOrder: number;
}

/** Gönderiye bağlı indirim / özel fiyat bilgisi (opsiyonel, legacy). */
export interface SocialPostPromo {
  label?: string | null;
  originalPriceMinor?: number | null;
  promoPriceMinor?: number | null;
  currency: string;
  validUntil?: string | null;
}

/** Yapılandırılmış fırsat / fiyat metadata (SC3). */
export interface DealMetadata {
  productName?: string | null;
  title?: string | null;
  listPriceMinor?: number | null;
  dealPriceMinor?: number | null;
  discountPercent?: number | null;
  currency: string;
  unit?: string | null;
  minQuantity?: string | null;
  stockQuantity?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  vatIncluded?: boolean | null;
  shippingIncluded?: boolean | null;
  locationText?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  brand?: string | null;
  maxQuantity?: string | null;
  deliveryRegions?: string[];
}

export interface SocialPost extends BaseEntity {
  authorProfileId: string;
  type: PostType;
  body?: string | null;
  visibility: PostVisibility;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  viewCount: number;
  uniqueViewCount?: number;
  shareCount?: number;
  repostCount?: number;
  originalPostId?: string | null;
  originalPost?: SocialPost | null;
  hashtags?: string[];
  mentions?: Array<{ username: string; displayName: string }>;
  sharedByMe?: boolean;
  commerceRequestId?: string | null;
  /** Legacy kampanya alanları; mapper DealMetadata'dan da doldurur. */
  promo?: SocialPostPromo | null;
  deal?: DealMetadata | null;
  media: FileAsset[];
  author?: SocialProfile | null;
  likedByMe?: boolean;
  savedByMe?: boolean;
}

export interface SocialPostComment extends BaseEntity {
  postId: string;
  authorProfileId: string;
  parentId?: string | null;
  body: string;
  likeCount: number;
  author?: SocialProfile | null;
}

/** Profilde kalıcı hikâye koleksiyonu (Instagram öne çıkanlar). */
export interface StoryHighlight {
  id: string;
  profileId: string;
  title: string;
  coverUrl?: string | null;
  itemCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Öne çıkan hikâye koleksiyonu ve içindeki gönderiler. */
export interface StoryHighlightDetail extends StoryHighlight {
  items: SocialPost[];
}

export interface FeedItem {
  id: string;
  kind: FeedItemKind;
  postId?: string | null;
  commerceRequestId?: string | null;
  authorProfileId?: string | null;
  score: number;
  createdAt: string;
  post?: SocialPost | null;
}

export interface ContentReportTargetPreview {
  preview: string;
  mediaUrl?: string | null;
  authorUserId?: string | null;
  authorName?: string | null;
  authorUsername?: string | null;
  removed: boolean;
}

export interface ContentReport {
  id: string;
  reporterUserId: string;
  reporterName?: string | null;
  targetType: ContentReportTarget;
  targetId: string;
  reason: string;
  status: ContentReportStatus;
  actionNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  target?: ContentReportTargetPreview | null;
}

/** SC5 — kategori takip özeti. */
export interface CategoryFollow {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  createdAt: string;
  isFollowing: boolean;
}

/** SC6 — sosyal analitik özeti. */
export interface SocialAnalyticsSummary {
  profileId: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  totalViews: number;
  totalShares?: number;
  totalReposts?: number;
  uniqueViews?: number;
  dealPostCount: number;
  quoteRequestCount?: number;
  messageStartCount?: number;
  requestConversionCount?: number;
  offerConversionCount?: number;
}

export interface TrendingTopic {
  slug: string;
  display: string;
  score: number;
  uniqueInteractions: number;
  postCount: number;
}
