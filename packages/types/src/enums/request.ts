export const RequestType = {
  SERVICE: 'SERVICE',
  PRODUCT_SUPPLY: 'PRODUCT_SUPPLY',
  MANUFACTURING: 'MANUFACTURING',
  RENTAL: 'RENTAL',
  LOGISTICS: 'LOGISTICS',
  PROFESSIONAL_SERVICE: 'PROFESSIONAL_SERVICE',
  CONSTRUCTION: 'CONSTRUCTION',
  WHOLESALE: 'WHOLESALE',
  B2B_PURCHASE: 'B2B_PURCHASE',
  OTHER: 'OTHER',
} as const;

export type RequestType = (typeof RequestType)[keyof typeof RequestType];

export const RequestStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  MATCHING: 'MATCHING',
  QUOTING: 'QUOTING',
  SELECTED: 'SELECTED',
  FULFILLING: 'FULFILLING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const RequestVisibility = {
  PUBLIC_MATCHED: 'PUBLIC_MATCHED',
  INVITE_ONLY: 'INVITE_ONLY',
} as const;

export type RequestVisibility = (typeof RequestVisibility)[keyof typeof RequestVisibility];

export const RequestSource = {
  WEB: 'WEB',
  MOBILE: 'MOBILE',
  API: 'API',
  IMPORT: 'IMPORT',
  AGENT: 'AGENT',
} as const;

export type RequestSource = (typeof RequestSource)[keyof typeof RequestSource];

export const RequestOfferStatus = {
  SUBMITTED: 'SUBMITTED',
  WITHDRAWN: 'WITHDRAWN',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type RequestOfferStatus = (typeof RequestOfferStatus)[keyof typeof RequestOfferStatus];

export const OrderSource = {
  MARKETPLACE: 'MARKETPLACE',
  COMMERCE_REQUEST: 'COMMERCE_REQUEST',
} as const;

export type OrderSource = (typeof OrderSource)[keyof typeof OrderSource];

export const BusinessMembershipStatus = {
  ACTIVE: 'ACTIVE',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type BusinessMembershipStatus =
  (typeof BusinessMembershipStatus)[keyof typeof BusinessMembershipStatus];
