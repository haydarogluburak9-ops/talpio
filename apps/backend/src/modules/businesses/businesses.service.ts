import { Injectable } from '@nestjs/common';
import { DEFAULT_COUNTRY_CODE, DEFAULT_TIMEZONE } from '@talpio/config';
import { BusinessMembershipStatus, PlatformRoleCode, VerificationStatus } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { CurrencyService } from '@infra/currency/currency.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { RbacService } from '@modules/rbac/rbac.service';
import { ProfilesService } from '@modules/social/profiles.service';

import type { CreateSupplierBusinessDto } from './dto/create-supplier.dto';
import type { UpdateBusinessLocaleSettingsDto } from './dto/locale-settings.dto';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly profiles: ProfilesService,
    private readonly currency: CurrencyService,
  ) {}

  /**
   * Tedarikçi işletmesi oluşturur: Business + membership + supplier rolü +
   * Order köprüsü için ProviderProfile (yoksa) + mağaza sosyal profili.
   */
  async createSupplier(user: AuthenticatedUser, dto: CreateSupplierBusinessDto) {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { id: { in: dto.categoryIds }, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (categories.length !== dto.categoryIds.length) {
      throw new AppException('VALIDATION_ERROR', { message: 'Geçersiz kategori seçimi.' });
    }

    let cityId = dto.cityId ?? null;
    const districtIds = dto.districtIds ?? [];

    if (districtIds.length > 0) {
      const districts = await this.prisma.district.findMany({
        where: { id: { in: districtIds }, isActive: true },
        select: { id: true, cityId: true },
      });
      if (districts.length !== districtIds.length) {
        throw new AppException('VALIDATION_ERROR', { message: 'Geçersiz ilçe seçimi.' });
      }
      cityId = cityId ?? districts[0]!.cityId;
    }

    if (!cityId) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Tedarikçi için şehir veya ilçe seçilmelidir.',
      });
    }

    const business = await this.prisma.$transaction(async (tx) => {
      let providerProfile = await tx.providerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!providerProfile) {
        providerProfile = await tx.providerProfile.create({
          data: {
            userId: user.id,
            businessName: dto.name,
            verificationStatus: VerificationStatus.UNVERIFIED,
          },
          select: { id: true },
        });
      }

      const created = await tx.business.create({
        data: {
          name: dto.name,
          ownerUserId: user.id,
          providerProfileId: providerProfile.id,
          verificationStatus: VerificationStatus.UNVERIFIED,
          isActive: true,
          categories: {
            create: dto.categoryIds.map((categoryId) => ({ categoryId })),
          },
          serviceAreas: {
            create:
              districtIds.length > 0
                ? districtIds.map((districtId) => ({ cityId: cityId, districtId }))
                : [{ cityId }],
          },
          // Para birimi sahibinin tercihinden gelir; sabit yazıldığında yurt
          // dışındaki her yeni mağaza lira ile açılıyordu.
          localeSettings: { create: await this.defaultLocaleSettings(user.id) },
        },
      });

      return created;
    });

    await this.rbac.ensureMembership({
      businessId: business.id,
      userId: user.id,
      roleCodes: [PlatformRoleCode.SUPPLIER],
    });
    await this.rbac.assignPlatformRole(user.id, PlatformRoleCode.SUPPLIER);
    await this.profiles.ensureBusinessProfile(business.id, user.id);

    return this.getMine(user);
  }

  async getMine(user: AuthenticatedUser) {
    return this.prisma.business.findMany({
      where: {
        deletedAt: null,
        memberships: { some: { userId: user.id, status: 'ACTIVE' } },
      },
      include: {
        categories: {
          select: { categoryId: true, category: { select: { slug: true, name: true } } },
        },
        serviceAreas: { select: { cityId: true, districtId: true } },
        providerProfile: { select: { id: true, verificationStatus: true } },
        localeSettings: true,
        socialProfile: {
          select: { id: true, username: true, displayName: true, kind: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Onaylı işletmeleri ada göre arar.
   *
   * Çalışan bağlantısı yalnızca tik almış firmalara kurulabilir; arama da
   * o yüzden doğrulanmamış kayıtları göstermez.
   */
  async searchVerified(query: string) {
    const q = query.trim();
    if (q.length < 2) return [];

    return this.prisma.business.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        verificationStatus: VerificationStatus.VERIFIED,
        name: { contains: q, mode: 'insensitive' },
      },
      take: 12,
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        socialProfile: { select: { username: true, displayName: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async claimEmployment(user: AuthenticatedUser, businessId: string) {
    const business = await this.requireVerifiedBusiness(businessId);
    if (business.ownerUserId === user.id) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Kendi firmanız için çalışan başvurusu gerekmez.',
      });
    }

    const existing = await this.prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId: user.id } },
    });
    if (existing?.status === BusinessMembershipStatus.ACTIVE) {
      throw new AppException('CONFLICT', { message: 'Bu firmada zaten çalışıyorsunuz.' });
    }

    return this.prisma.businessMembership.upsert({
      where: { businessId_userId: { businessId, userId: user.id } },
      create: {
        businessId,
        userId: user.id,
        status: BusinessMembershipStatus.INVITED,
      },
      update: { status: BusinessMembershipStatus.INVITED },
    });
  }

  async listEmploymentClaims(user: AuthenticatedUser, businessId: string) {
    await this.assertVerifiedOwner(user.id, businessId);

    return this.prisma.businessMembership.findMany({
      where: { businessId, status: BusinessMembershipStatus.INVITED },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async decideEmployment(
    user: AuthenticatedUser,
    businessId: string,
    memberUserId: string,
    approve: boolean,
  ) {
    await this.assertVerifiedOwner(user.id, businessId);
    if (memberUserId === user.id) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Kendi başvurunuzu karara bağlayamazsınız.',
      });
    }

    const membership = await this.prisma.businessMembership.findUnique({
      where: { businessId_userId: { businessId, userId: memberUserId } },
    });
    if (!membership || membership.status !== BusinessMembershipStatus.INVITED) {
      throw AppException.notFound('Çalışan başvurusu', memberUserId);
    }

    await this.prisma.businessMembership.update({
      where: { id: membership.id },
      data: {
        status: approve ? BusinessMembershipStatus.ACTIVE : BusinessMembershipStatus.SUSPENDED,
      },
    });

    if (approve) {
      await this.rbac.ensureMembership({
        businessId,
        userId: memberUserId,
        roleCodes: [PlatformRoleCode.ENTERPRISE_MEMBER],
      });
      // Profil yoksa tik yazılacak satır olmaz; önce kişisel profili kur.
      await this.profiles.ensurePersonalProfile(memberUserId);
      await this.prisma.socialProfile.updateMany({
        where: { userId: memberUserId, kind: 'PERSONAL', deletedAt: null },
        data: { isVerifiedDisplay: true },
      });
    }

    return { decided: true as const, approved: approve };
  }

  private async requireVerifiedBusiness(businessId: string) {
    const business = await this.prisma.business.findFirst({
      where: { id: businessId, deletedAt: null },
      select: { id: true, ownerUserId: true, verificationStatus: true },
    });
    if (!business) throw AppException.notFound('İşletme', businessId);
    if (business.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new AppException('FORBIDDEN', {
        message: 'Yalnızca onaylı firmalara başvurulabilir.',
      });
    }
    return business;
  }

  private async assertVerifiedOwner(userId: string, businessId: string): Promise<void> {
    const business = await this.requireVerifiedBusiness(businessId);
    if (business.ownerUserId !== userId) {
      throw new AppException('FORBIDDEN', {
        message: 'Çalışan tikini yalnızca firma sahibi verebilir.',
      });
    }
  }

  async getLocaleSettings(user: AuthenticatedUser, businessId: string) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const settings = await this.prisma.businessLocaleSettings.findUnique({
      where: { businessId },
    });
    if (settings) return settings;

    return this.prisma.businessLocaleSettings.create({
      data: { businessId, ...(await this.defaultLocaleSettings(user.id)) },
    });
  }

  /**
   * Yeni mağazanın yerel ayar varsayılanları.
   *
   * Sahibin para birimi ve ülkesi esas alınır. Sabit "TR / TRY" yazıldığında
   * Berlin'de açılan bir mağaza lira ile başlıyor ve satıcı bunu fark etmeden
   * ilan yayınlıyordu.
   */
  private async defaultLocaleSettings(userId: string): Promise<{
    defaultCurrency: string;
    defaultCountryCode: string;
    defaultTimezone: string;
  }> {
    const owner = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { countryCode: true },
    });

    return {
      defaultCurrency: await this.currency.forUser(userId),
      defaultCountryCode: owner?.countryCode?.toUpperCase() ?? DEFAULT_COUNTRY_CODE,
      defaultTimezone: DEFAULT_TIMEZONE,
    };
  }

  async updateLocaleSettings(
    user: AuthenticatedUser,
    businessId: string,
    dto: UpdateBusinessLocaleSettingsDto,
  ) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    const defaults = await this.defaultLocaleSettings(user.id);

    return this.prisma.businessLocaleSettings.upsert({
      where: { businessId },
      create: {
        businessId,
        defaultCurrency: dto.defaultCurrency?.toUpperCase() ?? defaults.defaultCurrency,
        defaultCountryCode: dto.defaultCountryCode?.toUpperCase() ?? defaults.defaultCountryCode,
        defaultTimezone: dto.defaultTimezone ?? defaults.defaultTimezone,
        taxId: emptyToNull(dto.taxId) ?? null,
        legalName: emptyToNull(dto.legalName) ?? null,
        invoiceTitle: emptyToNull(dto.invoiceTitle) ?? null,
        taxOffice: emptyToNull(dto.taxOffice) ?? null,
        address: emptyToNull(dto.address) ?? null,
        phone: emptyToNull(dto.phone) ?? null,
        logoUrl: emptyToNull(dto.logoUrl) ?? null,
        stampUrl: emptyToNull(dto.stampUrl) ?? null,
      },
      update: {
        ...(dto.defaultCurrency !== undefined
          ? { defaultCurrency: dto.defaultCurrency.toUpperCase() }
          : {}),
        ...(dto.defaultCountryCode !== undefined
          ? { defaultCountryCode: dto.defaultCountryCode.toUpperCase() }
          : {}),
        ...(dto.defaultTimezone !== undefined ? { defaultTimezone: dto.defaultTimezone } : {}),
        ...(dto.taxId !== undefined ? { taxId: emptyToNull(dto.taxId) } : {}),
        ...(dto.legalName !== undefined ? { legalName: emptyToNull(dto.legalName) } : {}),
        ...(dto.invoiceTitle !== undefined ? { invoiceTitle: emptyToNull(dto.invoiceTitle) } : {}),
        ...(dto.taxOffice !== undefined ? { taxOffice: emptyToNull(dto.taxOffice) } : {}),
        ...(dto.address !== undefined ? { address: emptyToNull(dto.address) } : {}),
        ...(dto.phone !== undefined ? { phone: emptyToNull(dto.phone) } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: emptyToNull(dto.logoUrl) } : {}),
        ...(dto.stampUrl !== undefined ? { stampUrl: emptyToNull(dto.stampUrl) } : {}),
      },
    });
  }

  async listCrmCustomers(user: AuthenticatedUser, businessId: string) {
    await this.rbac.assertBusinessAccess(user.id, businessId);
    return this.prisma.crmCustomer.findMany({
      where: { tenantId: businessId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        displayName: true,
        phone: true,
        email: true,
        notes: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { workOrders: true } },
      },
    });
  }
}

/** Boş string kayda yazılmaz; alan silinmiş sayılır. */
function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}
