import { Injectable } from '@nestjs/common';
import { requiredIncorporationDocuments } from '@talpio/config';
import {
  DocumentStatus,
  DocumentType,
  VerificationStatus,
  type ProviderDocument,
  type ProviderProfile,
  type ProviderService,
  type ProviderSummary,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';

import type {
  ProviderServiceInputDto,
  ReplaceProviderServiceAreasDto,
  ReplaceProviderServicesDto,
  UpdateProviderProfileDto,
} from './dto/provider-profile.dto';
import {
  providerInclude,
  toProviderProfile,
  toProviderService,
  toProviderSummary,
  type ProviderRow,
} from './provider.mapper';

@Injectable()
export class ProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<ProviderProfile> {
    return toProviderProfile(await this.requireOwnProfile(user));
  }

  /** Müşteriye açık satıcı kartı. Doğrulama durumu ve istatistikler dışında bilgi taşımaz. */
  async getPublicById(id: string): Promise<ProviderSummary> {
    const row = await this.prisma.providerProfile.findFirst({
      where: { id, deletedAt: null },
      include: providerInclude,
    });

    if (!row) throw AppException.notFound('Satıcı profili', id);

    return toProviderSummary(row, this.config.fileBaseUrl);
  }

  /**
   * Satıcının kendi profil bilgilerini günceller.
   *
   * Doğrulama durumu, rozet ve istatistikler burada değişmez: bunlar yönetim
   * onayından ve tamamlanan işlerden türetilir, satıcının beyanından değil.
   */
  async updateMe(user: AuthenticatedUser, dto: UpdateProviderProfileDto): Promise<ProviderProfile> {
    const profile = await this.requireOwnProfile(user);

    const row = await this.prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.businessName !== undefined ? { businessName: dto.businessName } : {}),
        ...(dto.about !== undefined ? { about: dto.about } : {}),
        ...(dto.experienceYears !== undefined ? { experienceYears: dto.experienceYears } : {}),
        ...(dto.acceptsUrgentJobs !== undefined
          ? { acceptsUrgentJobs: dto.acceptsUrgentJobs }
          : {}),
        ...(dto.canIssueInvoice !== undefined ? { canIssueInvoice: dto.canIssueInvoice } : {}),
      },
      include: providerInclude,
    });

    return toProviderProfile(row);
  }

  async listMyServices(user: AuthenticatedUser): Promise<ProviderService[]> {
    const profile = await this.requireOwnProfile(user);
    return profile.services.map(toProviderService);
  }

  /**
   * Hizmet listesini gönderilen içerikle değiştirir.
   *
   * Silip yeniden yazmak yerine fark alınır: mevcut satırlar korununca teklif
   * eşleşmesinde kullanılan `createdAt` sırası ve kimlikler sabit kalır.
   */
  async replaceMyServices(
    user: AuthenticatedUser,
    dto: ReplaceProviderServicesDto,
  ): Promise<ProviderService[]> {
    const profile = await this.requireOwnProfile(user);
    const incoming = dedupeServices(dto.services);

    await this.assertCategoriesExist(incoming);

    const existing = new Map(profile.services.map((row) => [serviceKey(row), row]));
    const keep = new Set<string>();

    await this.prisma.$transaction(async (tx) => {
      for (const service of incoming) {
        const key = serviceKey(service);
        keep.add(key);

        const current = existing.get(key);
        const startingPriceMinor = service.startingPriceMinor ?? null;

        if (!current) {
          await tx.providerService.create({
            data: {
              providerProfileId: profile.id,
              categoryId: service.categoryId,
              subcategoryId: service.subcategoryId ?? null,
              startingPriceMinor,
            },
          });
        } else if (current.startingPriceMinor !== startingPriceMinor) {
          await tx.providerService.update({
            where: { id: current.id },
            data: { startingPriceMinor },
          });
        }
      }

      const removed = profile.services.filter((row) => !keep.has(serviceKey(row)));

      if (removed.length > 0) {
        await tx.providerService.deleteMany({
          where: { id: { in: removed.map((row) => row.id) } },
        });
      }
    });

    const updated = await this.requireOwnProfile(user);
    return updated.services.map(toProviderService);
  }

  /**
   * Hizmet bölgelerini gönderilen ilçe listesiyle değiştirir.
   *
   * Bölge kaydı fiyat gibi ek veri taşımadığı için tamamı silinip yeniden
   * yazılır; fark almanın kazandıracağı bir şey yok.
   */
  async replaceMyServiceAreas(
    user: AuthenticatedUser,
    dto: ReplaceProviderServiceAreasDto,
  ): Promise<ProviderProfile> {
    const profile = await this.requireOwnProfile(user);
    const districtIds = [...new Set(dto.districtIds)];

    await this.assertDistrictsExist(districtIds);

    await this.prisma.$transaction([
      this.prisma.providerServiceArea.deleteMany({ where: { providerProfileId: profile.id } }),
      this.prisma.providerServiceArea.createMany({
        data: districtIds.map((districtId) => ({ providerProfileId: profile.id, districtId })),
      }),
    ]);

    return toProviderProfile(await this.requireOwnProfile(user));
  }

  /**
   * Satıcının ülkesine göre istenen kuruluş belgeleri ve mevcut yüklemeler.
   *
   * Ülke, bağlı işletmenin locale ayarından, yoksa kullanıcının ülke
   * tercihinden okunur. Paket eksikken profil `PENDING` olmaz: belge
   * yüklendiğinde geçer.
   */
  async listMyDocuments(user: AuthenticatedUser): Promise<{
    countryCode: string;
    requiredTypes: readonly DocumentType[];
    documents: ProviderDocument[];
  }> {
    const profile = await this.requireOwnProfile(user);
    const countryCode = await this.resolveCountryCode(user.id, profile.id);
    const documents = await this.prisma.providerDocument.findMany({
      where: { providerProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      countryCode,
      requiredTypes: requiredIncorporationDocuments(countryCode),
      documents: documents.map(toProviderDocument),
    };
  }

  async uploadDocument(
    user: AuthenticatedUser,
    input: { type: DocumentType; fileId: string; expiresAt?: string },
  ): Promise<ProviderDocument> {
    const profile = await this.requireOwnProfile(user);
    await this.files.assertOwnedBy(user.id, [input.fileId]);

    const existing = await this.prisma.providerDocument.findFirst({
      where: {
        providerProfileId: profile.id,
        fileId: input.fileId,
      },
      select: { id: true },
    });
    if (existing) {
      throw new AppException('CONFLICT', {
        message: 'Bu dosya zaten bir belge olarak kayıtlı.',
      });
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const document = await tx.providerDocument.create({
        data: {
          providerProfileId: profile.id,
          type: input.type,
          fileId: input.fileId,
          status: DocumentStatus.PENDING,
          ...(input.expiresAt ? { expiresAt: new Date(input.expiresAt) } : {}),
        },
      });

      // Reddedilmiş veya henüz başlamamış bir inceleme, belge gelince kuyruğa
      // düşer. Onaylı profili belge eklemek tek başına düşürmez: aksi halde
      // satıcı her yeni dosyada rozetini kaybederdi.
      if (profile.verificationStatus !== VerificationStatus.VERIFIED) {
        await tx.providerProfile.update({
          where: { id: profile.id },
          data: { verificationStatus: VerificationStatus.PENDING },
        });
        await tx.business.updateMany({
          where: { providerProfileId: profile.id, deletedAt: null },
          data: { verificationStatus: VerificationStatus.PENDING },
        });
      }

      return document;
    });

    return toProviderDocument(created);
  }

  private async resolveCountryCode(userId: string, providerProfileId: string): Promise<string> {
    const [settings, user] = await Promise.all([
      this.prisma.businessLocaleSettings.findFirst({
        where: { business: { providerProfileId, deletedAt: null } },
        select: { defaultCountryCode: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { countryCode: true },
      }),
    ]);

    return settings?.defaultCountryCode?.toUpperCase() ?? user?.countryCode?.toUpperCase() ?? 'TR';
  }

  private async requireOwnProfile(user: AuthenticatedUser): Promise<ProviderRow> {
    const existing = await this.prisma.providerProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
      include: providerInclude,
    });
    if (existing) return existing;

    await this.prisma.providerProfile.create({ data: { userId: user.id } });
    const row = await this.prisma.providerProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
      include: providerInclude,
    });
    if (!row) {
      throw AppException.forbiddenResource('Satıcı profili', { userId: user.id });
    }
    return row;
  }

  /** Alt kategori seçildiyse gerçekten o kategoriye ait olmalı. */
  private async assertCategoriesExist(services: ProviderServiceInputDto[]): Promise<void> {
    if (services.length === 0) return;

    const categoryIds = [...new Set(services.map((service) => service.categoryId))];
    const found = await this.prisma.serviceCategory.findMany({
      where: { id: { in: categoryIds }, deletedAt: null, isActive: true },
      select: { id: true },
    });

    const known = new Set(found.map((row) => row.id));
    const unknown = categoryIds.filter((id) => !known.has(id));

    if (unknown.length > 0) {
      throw AppException.notFound('Hizmet kategorisi', unknown.join(', '));
    }

    const pairs = services.filter(
      (service): service is ProviderServiceInputDto & { subcategoryId: string } =>
        typeof service.subcategoryId === 'string',
    );

    if (pairs.length === 0) return;

    const subcategories = await this.prisma.serviceSubcategory.findMany({
      where: {
        id: { in: pairs.map((service) => service.subcategoryId) },
        deletedAt: null,
        isActive: true,
      },
      select: { id: true, categoryId: true },
    });

    const byId = new Map(subcategories.map((row) => [row.id, row.categoryId]));
    const invalid = pairs.filter(
      (service) => byId.get(service.subcategoryId) !== service.categoryId,
    );

    if (invalid.length > 0) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Alt hizmet seçilen kategoriye ait değil.',
        context: { services: invalid.map((service) => service.subcategoryId) },
      });
    }
  }

  private async assertDistrictsExist(districtIds: string[]): Promise<void> {
    if (districtIds.length === 0) return;

    const found = await this.prisma.district.count({
      where: { id: { in: districtIds }, isActive: true },
    });

    if (found !== districtIds.length) {
      throw AppException.notFound('İlçe', districtIds.join(', '));
    }
  }
}

/** Aynı kategori/alt kategori ikilisi iki kez gönderilirse son fiyat geçerlidir. */
function dedupeServices(services: ProviderServiceInputDto[]): ProviderServiceInputDto[] {
  const byKey = new Map<string, ProviderServiceInputDto>();
  for (const service of services) byKey.set(serviceKey(service), service);
  return [...byKey.values()];
}

function serviceKey(service: { categoryId: string; subcategoryId?: string | null }): string {
  return `${service.categoryId}:${service.subcategoryId ?? ''}`;
}

function toProviderDocument(row: {
  id: string;
  providerProfileId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileId: string;
  expiresAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ProviderDocument {
  return {
    id: row.id,
    providerProfileId: row.providerProfileId,
    type: row.type,
    status: row.status,
    fileId: row.fileId,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
