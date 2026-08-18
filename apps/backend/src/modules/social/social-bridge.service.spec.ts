import { UserRole } from '@talpio/types';

import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuditLogService } from '@modules/admin/audit-log.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { RequestsService } from '@modules/requests/requests.service';

import type { PostsService } from './posts.service';
import type { ProfilesService } from './profiles.service';
import { SocialBridgeService } from './social-bridge.service';

const USER_ID = 'user-1';
const PROFILE_ID = 'profile-1';
const POST_ID = '0194a1b2-c3d4-7000-8000-000000000010';
const REQUEST_ID = '0194a1b2-c3d4-7000-8000-000000000020';

const user: AuthenticatedUser = { id: USER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };

function postRow() {
  const now = new Date('2026-08-01T10:00:00.000Z');
  return {
    id: POST_ID,
    authorProfileId: PROFILE_ID,
    type: 'DEAL',
    body: 'Motor yağı fırsatı detaylı açıklama',
    visibility: 'PUBLIC',
    likeCount: 0,
    commentCount: 0,
    saveCount: 0,
    viewCount: 0,
    commerceRequestId: null,
    promoLabel: '5W-30',
    originalPriceMinor: 120_00,
    promoPriceMinor: 99_00,
    promoCurrency: 'TRY',
    promoValidUntil: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    author: {
      id: PROFILE_ID,
      kind: 'PERSONAL',
      userId: USER_ID,
      businessId: null,
      username: 'satici',
      displayName: 'Satıcı',
      bio: null,
      avatarFileId: null,
      coverFileId: null,
      locationCityId: null,
      locationText: null,
      followerCount: 0,
      followingCount: 0,
      postCount: 1,
      isVerifiedDisplay: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      avatar: null,
      cover: null,
    },
    dealMetadata: {
      productName: 'Shell Helix',
      title: '5W-30 fırsat',
      listPriceMinor: 120_00,
      dealPriceMinor: 99_00,
      discountPercent: 17,
      currency: 'TRY',
      unit: 'adet',
      minQuantity: '12',
      stockQuantity: null,
      startsAt: null,
      endsAt: null,
      vatIncluded: true,
      shippingIncluded: null,
      locationText: null,
      categoryId: null,
      subcategoryId: null,
      brand: 'Shell',
    },
    media: [],
  };
}

describe('SocialBridgeService', () => {
  it('createRequestFromPost RequestsService.create çağırır; prisma.commerceRequest kullanmaz', async () => {
    const commerceCreate = jest.fn();
    const prisma = {
      post: { findFirst: jest.fn().mockResolvedValue(postRow()) },
      commerceRequest: { create: commerceCreate },
    };
    const requests = {
      create: jest.fn().mockResolvedValue({
        id: REQUEST_ID,
        title: '5W-30 fırsat',
        buyerUserId: USER_ID,
      }),
      getById: jest.fn(),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };

    const service = new SocialBridgeService(
      prisma as unknown as PrismaService,
      { fileBaseUrl: 'http://x' } as unknown as AppConfigService,
      {} as PostsService,
      {} as ProfilesService,
      requests as unknown as RequestsService,
      audit as unknown as AuditLogService,
    );

    const created = await service.createRequestFromPost(user, POST_ID);

    expect(created.id).toBe(REQUEST_ID);
    expect(requests.create).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        requestType: 'PRODUCT_SUPPLY',
        title: '5W-30 fırsat',
        budgetMinor: 99_00,
        publish: false,
        specifications: expect.objectContaining({ sourcePostId: POST_ID, brand: 'Shell' }),
      }),
    );
    expect(commerceCreate).not.toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'social.post.create_request', entityId: REQUEST_ID }),
    );
  });

  it('shareRequestToFeed aynı request için idempotent döner', async () => {
    const existing = {
      ...postRow(),
      type: 'REQUEST_SHARE',
      commerceRequestId: REQUEST_ID,
      body: 'Talep paylaşımı: Yağ talebi',
      dealMetadata: null,
    };
    const prisma = {
      post: {
        findFirst: jest.fn().mockResolvedValue(existing),
      },
    };
    const posts = { create: jest.fn() };
    const profiles = {
      ensurePersonalProfile: jest.fn().mockResolvedValue({ id: PROFILE_ID }),
    };
    const requests = {
      create: jest.fn(),
      getById: jest.fn().mockResolvedValue({
        id: REQUEST_ID,
        title: 'Yağ talebi',
        buyerUserId: USER_ID,
      }),
    };

    const service = new SocialBridgeService(
      prisma as unknown as PrismaService,
      { fileBaseUrl: 'http://localhost:9000/x' } as unknown as AppConfigService,
      posts as unknown as PostsService,
      profiles as unknown as ProfilesService,
      requests as unknown as RequestsService,
      { record: jest.fn() } as unknown as AuditLogService,
    );

    const first = await service.shareRequestToFeed(user, REQUEST_ID);
    const second = await service.shareRequestToFeed(user, REQUEST_ID);

    expect(first.id).toBe(existing.id);
    expect(second.id).toBe(existing.id);
    expect(posts.create).not.toHaveBeenCalled();
  });
});
