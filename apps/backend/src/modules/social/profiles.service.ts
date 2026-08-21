import { Injectable } from '@nestjs/common';
import {
  DocumentStatus,
  OrderStatus,
  RequestOfferStatus,
  SocialProfileKind,
  VerificationStatus,
  type SocialBusinessCard,
  type SocialProfile,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';

import { ratioPercent, toFiniteNumber } from './business-profile.stats';
import type { UpdateSocialProfileDto } from './dto/social.dto';
import { CAMPAIGN_POST_TYPES, DEAL_POST_TYPES, PORTFOLIO_POST_TYPES } from './post-tabs';
import { socialProfileSelect, toSocialProfile, toSocialProfileEducation, toSocialProfileExperience, type SocialProfileRow } from './social.mapper';
import {
  isValidUsernameFormat,
  normalizeUsername,
  RESERVED_USERNAMES,
  slugifyUsername,
  withUsernameSuffix,
} from './username.util';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
  ) {}

  async ensurePersonalProfile(userId: string): Promise<SocialProfile> {
    const existing = await this.prisma.socialProfile.findFirst({
      where: { userId, kind: SocialProfileKind.PERSONAL, deletedAt: null },
      select: socialProfileSelect,
    });
    if (existing) return toSocialProfile(existing, this.fileBaseUrl);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (!user) throw AppException.notFound('Kullanıcı', userId);

    const username = await this.allocateUsername(slugifyUsername(user.fullName));
    const created = await this.prisma.socialProfile.create({
      data: {
        kind: SocialProfileKind.PERSONAL,
        userId: user.id,
        username,
        displayName: user.fullName,
      },
      select: socialProfileSelect,
    });

    return toSocialProfile(created, this.fileBaseUrl);
  }

  async ensureBusinessProfile(businessId: string, actorUserId: string): Promise<SocialProfile> {
    const existing = await this.prisma.socialProfile.findFirst({
      where: { businessId, kind: SocialProfileKind.BUSINESS, deletedAt: null },
      select: socialProfileSelect,
    });
    if (existing) return toSocialProfile(existing, this.fileBaseUrl);

    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        deletedAt: null,
        OR: [
          { ownerUserId: actorUserId },
          { memberships: { some: { userId: actorUserId, status: 'ACTIVE' } } },
        ],
      },
      select: { id: true, name: true, slug: true },
    });
    if (!business) throw AppException.notFound('İşletme', businessId);

    const base = slugifyUsername(business.slug ?? business.name);
    const username = await this.allocateUsername(base);
    const created = await this.prisma.socialProfile.create({
      data: {
        kind: SocialProfileKind.BUSINESS,
        businessId: business.id,
        username,
        displayName: business.name,
      },
      select: socialProfileSelect,
    });

    return toSocialProfile(created, this.fileBaseUrl);
  }

  async getMe(user: AuthenticatedUser): Promise<SocialProfile> {
    const base = await this.ensurePersonalProfile(user.id);
    const row = await this.prisma.socialProfile.findFirst({
      where: { id: base.id },
      select: socialProfileSelect,
    });
    if (!row) return base;
    return this.toProfileWithCareer(row);
  }

  async updateMe(user: AuthenticatedUser, dto: UpdateSocialProfileDto): Promise<SocialProfile> {
    const profile = await this.ensurePersonalProfile(user.id);

    const fileIds = [dto.avatarFileId, dto.coverFileId].filter(
      (id): id is string => typeof id === 'string',
    );
    await this.files.assertOwnedBy(user.id, fileIds);

    if (dto.username && dto.username !== profile.username) {
      await this.assertUsernameAvailable(dto.username, profile.id);
    }

    const updated = await this.prisma.socialProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.headline !== undefined ? { headline: dto.headline } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.locationCityId !== undefined ? { locationCityId: dto.locationCityId } : {}),
        ...(dto.locationText !== undefined ? { locationText: dto.locationText } : {}),
        ...(dto.avatarFileId !== undefined ? { avatarFileId: dto.avatarFileId } : {}),
        ...(dto.coverFileId !== undefined ? { coverFileId: dto.coverFileId } : {}),
      },
      select: socialProfileSelect,
    });

    return this.toProfileWithCareer(updated);
  }

  async getByUsername(username: string, viewerUserId?: string): Promise<SocialProfile> {
    const row = await this.prisma.socialProfile.findFirst({
      where: { username: username.toLowerCase(), deletedAt: null },
      select: socialProfileSelect,
    });
    if (!row) throw AppException.notFound('Profil', username);

    let isFollowing: boolean | undefined;
    if (viewerUserId) {
      const viewer = await this.prisma.socialProfile.findFirst({
        where: { userId: viewerUserId, kind: SocialProfileKind.PERSONAL, deletedAt: null },
        select: { id: true },
      });
      if (viewer) {
        const follow = await this.prisma.follow.findUnique({
          where: {
            followerProfileId_followingProfileId: {
              followerProfileId: viewer.id,
              followingProfileId: row.id,
            },
          },
          select: { id: true },
        });
        isFollowing = Boolean(follow);
      }
    }

    const business =
      row.kind === SocialProfileKind.BUSINESS && row.businessId
        ? await this.loadBusinessCard(row.id, row.businessId, row.bio)
        : null;

    return this.toProfileWithCareer(row, {
      isFollowing,
      ...(business ? { business } : {}),
    });
  }

  async getByBusinessId(businessId: string): Promise<SocialProfile> {
    const row = await this.prisma.socialProfile.findFirst({
      where: { businessId, kind: SocialProfileKind.BUSINESS, deletedAt: null },
      select: socialProfileSelect,
    });
    if (!row) throw AppException.notFound('İşletme profili', businessId);
    const business = await this.loadBusinessCard(row.id, businessId, row.bio);
    return toSocialProfile(row, this.fileBaseUrl, { business });
  }

  async checkUsernameAvailability(
    raw: string,
    excludeProfileId?: string,
  ): Promise<{ available: boolean; username: string }> {
    const username = normalizeUsername(raw);
    if (!isValidUsernameFormat(username) || RESERVED_USERNAMES.has(username)) {
      return { available: false, username };
    }

    const taken = await this.prisma.socialProfile.findFirst({
      where: {
        username,
        deletedAt: null,
        ...(excludeProfileId ? { NOT: { id: excludeProfileId } } : {}),
      },
      select: { id: true },
    });

    return { available: !taken, username };
  }

  async assertUsernameAvailable(username: string, excludeProfileId?: string): Promise<void> {
    const result = await this.checkUsernameAvailability(username, excludeProfileId);
    if (!result.available) {
      throw new AppException('USERNAME_TAKEN', {
        message: 'Bu kullanıcı adı kullanılıyor.',
        context: { username: result.username },
      });
    }
  }

  async allocateUsername(base: string): Promise<string> {
    const candidate = base.slice(0, 32);
    const exists = await this.prisma.socialProfile.findFirst({
      where: { username: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;

    for (let i = 0; i < 20; i += 1) {
      const suffix = `${Math.floor(Math.random() * 900 + 100)}`;
      const next = withUsernameSuffix(candidate, suffix);
      const taken = await this.prisma.socialProfile.findFirst({
        where: { username: next },
        select: { id: true },
      });
      if (!taken) return next;
    }

    return withUsernameSuffix(candidate, Date.now().toString(36).slice(-6));
  }

  private async loadBusinessCard(
    profileId: string,
    businessId: string,
    profileBio: string | null,
  ): Promise<SocialBusinessCard> {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: {
        id: true,
        ownerUserId: true,
        verificationStatus: true,
        providerProfileId: true,
        categories: {
          select: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        serviceAreas: {
          select: { city: { select: { name: true } } },
        },
        localeSettings: { select: { taxId: true } },
        trustScore: { select: { score: true, computedAt: true } },
        providerProfile: {
          select: {
            id: true,
            about: true,
            averageRating: true,
            reviewCount: true,
            averageResponseMinutes: true,
            verificationStatus: true,
            documents: {
              where: { status: DocumentStatus.APPROVED, deletedAt: null },
              select: { type: true },
            },
          },
        },
      },
    });
    if (!business) {
      throw AppException.notFound('İşletme', businessId);
    }

    const provider = business.providerProfile;
    const [
      notifiedMatches,
      offerTotal,
      offerAccepted,
      completedOrders,
      dealPostCount,
      campaignPostCount,
      portfolioPostCount,
    ] = await Promise.all([
      this.prisma.requestMatch.count({
        where: { businessId, notifiedAt: { not: null } },
      }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null },
      }),
      this.prisma.requestOffer.count({
        where: { businessId, deletedAt: null, status: RequestOfferStatus.ACCEPTED },
      }),
      this.prisma.order.count({
        where: {
          deletedAt: null,
          status: OrderStatus.COMPLETED,
          OR: [
            ...(provider ? [{ providerProfileId: provider.id }] : []),
            { requestOrderLink: { requestOffer: { businessId } } },
          ],
        },
      }),
      this.prisma.post.count({
        where: {
          authorProfileId: profileId,
          deletedAt: null,
          OR: [{ type: { in: [...DEAL_POST_TYPES] } }, { dealMetadata: { isNot: null } }],
        },
      }),
      this.prisma.post.count({
        where: {
          authorProfileId: profileId,
          deletedAt: null,
          type: { in: [...CAMPAIGN_POST_TYPES] },
        },
      }),
      this.prisma.post.count({
        where: {
          authorProfileId: profileId,
          deletedAt: null,
          type: { in: [...PORTFOLIO_POST_TYPES] },
        },
      }),
    ]);

    const regions = [
      ...new Set(business.serviceAreas.map((area) => area.city.name).filter(Boolean)),
    ];
    const isVerified =
      business.verificationStatus === VerificationStatus.VERIFIED ||
      provider?.verificationStatus === VerificationStatus.VERIFIED;

    return {
      businessId: business.id,
      ownerUserId: business.ownerUserId,
      providerProfileId: provider?.id ?? business.providerProfileId,
      isVerified,
      about: provider?.about?.trim() || profileBio,
      categories: business.categories.map((row) => row.category),
      serviceRegions: regions,
      rating: toFiniteNumber(provider?.averageRating),
      reviewCount: provider?.reviewCount ?? 0,
      responseRate: ratioPercent(offerTotal, notifiedMatches),
      averageResponseMinutes: provider?.averageResponseMinutes ?? null,
      offerAcceptanceRate: ratioPercent(offerAccepted, offerTotal),
      completedOrderCount: completedOrders,
      dealPostCount,
      campaignPostCount,
      portfolioPostCount,
      credentials: (provider?.documents ?? []).map((doc) => ({ type: doc.type })),
      trustScore: business.trustScore
        ? {
            score: business.trustScore.score,
            computedAt: business.trustScore.computedAt.toISOString(),
          }
        : null,
    };
  }

  private async toProfileWithCareer(
    row: SocialProfileRow,
    extras: { isFollowing?: boolean; business?: SocialProfile['business'] } = {},
  ): Promise<SocialProfile> {
    const career = await this.loadCareer(row.id, row.kind);
    return toSocialProfile(row, this.fileBaseUrl, { ...extras, ...career });
  }

  private async loadCareer(profileId: string, kind: SocialProfileKind) {
    if (kind !== SocialProfileKind.PERSONAL) {
      return { experiences: [], education: [] };
    }

    const [experiences, education] = await Promise.all([
      this.prisma.socialProfileExperience.findMany({
        where: { profileId },
        orderBy: [{ isCurrent: 'desc' }, { startYear: 'desc' }, { sortOrder: 'asc' }],
      }),
      this.prisma.socialProfileEducation.findMany({
        where: { profileId },
        orderBy: [{ isCurrent: 'desc' }, { startYear: 'desc' }, { sortOrder: 'asc' }],
      }),
    ]);

    return {
      experiences: experiences.map(toSocialProfileExperience),
      education: education.map(toSocialProfileEducation),
    };
  }

  private get fileBaseUrl(): string {
    return this.config.fileBaseUrl;
  }
}
