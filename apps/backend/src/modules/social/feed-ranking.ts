import { PostType } from '@talpio/types';

const DEALISH_TYPES = new Set<string>([
  PostType.DEAL,
  PostType.SPECIAL_PRICE,
  PostType.DISCOUNT,
  PostType.CAMPAIGN,
  PostType.BULK_PRICE,
  PostType.LIMITED_STOCK,
  PostType.CLEARANCE,
  PostType.SERVICE_PROMOTION,
  PostType.B2B_CAMPAIGN,
  PostType.NEW_PRODUCT,
]);

const MS_PER_HOUR = 1000 * 60 * 60;
const ENDING_SOON_HOURS = 72;
const ENGAGEMENT_SCORE_CAP = 50;

export interface FeedScoreInput {
  authorFollowed: boolean;
  categoryFollowed?: boolean;
  type: string;
  hasDealMetadata: boolean;
  dealEndsAt?: Date | null;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  createdAt: Date;
  now?: Date;
  /** v2 */
  locationMatch?: boolean;
  requestCategoryMatch?: boolean;
  offerCategoryMatch?: boolean;
  saveCategoryMatch?: boolean;
  authorIsBusiness?: boolean;
  stockExhausted?: boolean;
  alreadySeen?: boolean;
  shareCount?: number;
  repostCount?: number;
  likedCategoryMatch?: boolean;
  viewedCategoryMatch?: boolean;
  similarAuthor?: boolean;
}

/**
 * Feed ranking v2 (read-time, deterministic, test edilebilir).
 * v1 sinyalleri korunur; konum / talep geçmişi / stok / tekrar gösterim eklenir.
 */
export function computeFeedScore(input: FeedScoreInput): number {
  const now = input.now ?? new Date();
  let score = 0;

  if (input.authorFollowed) score += 100;
  if (input.categoryFollowed) score += 60;
  if (input.likedCategoryMatch) score += 45;
  if (input.viewedCategoryMatch) score += 30;
  if (input.similarAuthor) score += 35;
  if (input.locationMatch) score += input.authorFollowed ? 20 : 55;
  if (input.requestCategoryMatch) score += 25;
  if (input.offerCategoryMatch) score += 20;
  if (input.saveCategoryMatch) score += 12;
  if (input.authorIsBusiness) score += 8;

  if (input.hasDealMetadata || DEALISH_TYPES.has(input.type)) {
    score += 40;
  }

  if (input.dealEndsAt) {
    const msLeft = input.dealEndsAt.getTime() - now.getTime();
    if (msLeft > 0 && msLeft <= ENDING_SOON_HOURS * MS_PER_HOUR) {
      score += 20;
    }
  }

  if (input.stockExhausted) score -= 40;
  if (input.alreadySeen) score -= 25;

  const engagement =
    Math.max(0, input.likeCount) +
    Math.max(0, input.commentCount) +
    Math.max(0, input.saveCount) +
    Math.max(0, input.shareCount ?? 0) +
    Math.max(0, input.repostCount ?? 0);
  score += Math.min(ENGAGEMENT_SCORE_CAP, 10 * Math.log1p(engagement));

  const ageHours = Math.max(0, (now.getTime() - input.createdAt.getTime()) / MS_PER_HOUR);
  score -= ageHours * 0.5;

  return score;
}

export function parseStockQuantity(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
