export const SocialProfileKind = {
  PERSONAL: 'PERSONAL',
  BUSINESS: 'BUSINESS',
} as const;

export type SocialProfileKind = (typeof SocialProfileKind)[keyof typeof SocialProfileKind];

export const PostType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  MULTI_IMAGE: 'MULTI_IMAGE',
  VIDEO: 'VIDEO',
  PRODUCT: 'PRODUCT',
  SERVICE: 'SERVICE',
  COMPLETED_WORK: 'COMPLETED_WORK',
  BEFORE_AFTER: 'BEFORE_AFTER',
  CAMPAIGN: 'CAMPAIGN',
  REQUEST_SHARE: 'REQUEST_SHARE',
  REFERENCE: 'REFERENCE',
  QUESTION: 'QUESTION',
  POLL: 'POLL',
  STANDARD: 'STANDARD',
  DEAL: 'DEAL',
  SPECIAL_PRICE: 'SPECIAL_PRICE',
  DISCOUNT: 'DISCOUNT',
  BULK_PRICE: 'BULK_PRICE',
  LIMITED_STOCK: 'LIMITED_STOCK',
  CLEARANCE: 'CLEARANCE',
  SERVICE_PROMOTION: 'SERVICE_PROMOTION',
  B2B_CAMPAIGN: 'B2B_CAMPAIGN',
  NEW_PRODUCT: 'NEW_PRODUCT',
  BUSINESS_UPDATE: 'BUSINESS_UPDATE',
  REPOST: 'REPOST',
  QUOTE: 'QUOTE',
} as const;

export type PostType = (typeof PostType)[keyof typeof PostType];

export const PostVisibility = {
  PUBLIC: 'PUBLIC',
  FOLLOWERS: 'FOLLOWERS',
  BUSINESS_ONLY: 'BUSINESS_ONLY',
  CATEGORY_TARGETED: 'CATEGORY_TARGETED',
  B2B_TARGETED: 'B2B_TARGETED',
  PRIVATE: 'PRIVATE',
} as const;

export type PostVisibility = (typeof PostVisibility)[keyof typeof PostVisibility];

export const FeedItemKind = {
  POST: 'POST',
  COMMERCE_REQUEST: 'COMMERCE_REQUEST',
} as const;

export type FeedItemKind = (typeof FeedItemKind)[keyof typeof FeedItemKind];

export const ContentReportStatus = {
  OPEN: 'OPEN',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  APPEALED: 'APPEALED',
} as const;

export type ContentReportStatus = (typeof ContentReportStatus)[keyof typeof ContentReportStatus];

export const ContentReportTarget = {
  POST: 'POST',
  COMMENT: 'COMMENT',
  PROFILE: 'PROFILE',
} as const;

export type ContentReportTarget = (typeof ContentReportTarget)[keyof typeof ContentReportTarget];

export const ModerationAction = {
  NONE: 'NONE',
  REMOVE_CONTENT: 'REMOVE_CONTENT',
  SUSPEND_AUTHOR: 'SUSPEND_AUTHOR',
  BAN_AUTHOR: 'BAN_AUTHOR',
} as const;

export type ModerationAction = (typeof ModerationAction)[keyof typeof ModerationAction];
