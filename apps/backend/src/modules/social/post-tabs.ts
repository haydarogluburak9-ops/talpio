import type { Prisma } from '@/generated/prisma/client';
import { PostType } from '@talpio/types';

export const DEAL_POST_TYPES = [
  PostType.DEAL,
  PostType.SPECIAL_PRICE,
  PostType.DISCOUNT,
  PostType.BULK_PRICE,
  PostType.LIMITED_STOCK,
  PostType.CLEARANCE,
  PostType.SERVICE_PROMOTION,
  PostType.NEW_PRODUCT,
] as const;

export const CAMPAIGN_POST_TYPES = [PostType.CAMPAIGN, PostType.B2B_CAMPAIGN] as const;

export const PORTFOLIO_POST_TYPES = [
  PostType.COMPLETED_WORK,
  PostType.BEFORE_AFTER,
  PostType.REFERENCE,
  PostType.PRODUCT,
  PostType.SERVICE,
] as const;

export type SocialPostTab = 'posts' | 'deals' | 'campaigns' | 'portfolio';

export function postTabWhere(tab?: string): Prisma.PostWhereInput {
  if (tab === 'deals') {
    return {
      OR: [{ type: { in: [...DEAL_POST_TYPES] } }, { dealMetadata: { isNot: null } }],
    };
  }
  if (tab === 'campaigns') {
    return { type: { in: [...CAMPAIGN_POST_TYPES] } };
  }
  if (tab === 'portfolio') {
    return { type: { in: [...PORTFOLIO_POST_TYPES] } };
  }
  return {};
}
