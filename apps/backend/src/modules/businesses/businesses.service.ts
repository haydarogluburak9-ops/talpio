import { Injectable } from '@nestjs/common';
import { DEFAULT_COUNTRY_CODE, DEFAULT_TIMEZONE } from '@talpio/config';
import { PlatformRoleCode, VerificationStatus } from '@talpio/types';

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
        taxId: dto.taxId ?? null,
      },
      update: {
        ...(dto.defaultCurrency !== undefined
          ? { defaultCurrency: dto.defaultCurrency.toUpperCase() }
          : {}),
        ...(dto.defaultCountryCode !== undefined
          ? { defaultCountryCode: dto.defaultCountryCode.toUpperCase() }
          : {}),
        ...(dto.defaultTimezone !== undefined ? { defaultTimezone: dto.defaultTimezone } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
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
