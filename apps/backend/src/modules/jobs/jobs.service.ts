import { Injectable, Optional } from '@nestjs/common';
import { canTransitionJobStatus } from '@talpio/business-logic';
import { deepLinks, JOB } from '@talpio/config';
import { JobRequestStatus, NotificationType, UserRole, type JobRequest } from '@talpio/types';

import type { Prisma } from '@/generated/prisma/client';
import { AppException } from '@common/errors/app.exception';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';
import { FraudService } from '@modules/fraud/fraud.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type { CreateJobDto } from './dto/create-job.dto';
import type { AvailableJobsQueryDto, ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { jobRequestInclude, toJobRequest, type JobRequestRow } from './job.mapper';

/** Satıcıların havuzda görebileceği durumlar. Diğerleri artık teklife kapalıdır. */
const OPEN_TO_PROVIDERS: JobRequestStatus[] = [
  JobRequestStatus.PUBLISHED,
  JobRequestStatus.OFFERS_RECEIVED,
];

const SORTABLE_FIELDS = ['createdAt', 'publishedAt', 'updatedAt'] as const;

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
    @Optional() private readonly fraud?: FraudService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateJobDto): Promise<JobRequest> {
    await this.assertCategoryExists(dto.categoryId, dto.subcategoryId);
    await this.assertDistrictBelongsToCity(dto.address.cityId, dto.address.districtId);
    // Kimlik tahmin eden birinin yabancı dosyayı kendi talebine iliştirmesi engellenir.
    await this.files.assertOwnedBy(user.id, dto.attachmentFileIds);

    const now = new Date();
    const publish = dto.publish;
    const status = publish ? JobRequestStatus.PUBLISHED : JobRequestStatus.DRAFT;

    // Adres satırı girildiyse kalıcı adres defterine yazılır; talep ona bağlanır.
    const addressId = await this.resolveAddressId(user.id, dto);

    const created = await this.prisma.$transaction(async (tx) => {
      const job = await tx.jobRequest.create({
        data: {
          customerId: user.id,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId ?? null,
          title: dto.title,
          description: dto.description,
          status,
          isUrgent: dto.isUrgent,
          size: dto.size,
          materialsIncluded: dto.materialsIncluded ?? null,
          inspectionRequired: dto.inspectionRequired,
          budgetMinor: dto.budgetMinor ?? null,
          problemStartedAt: dto.problemStartedAt ? new Date(dto.problemStartedAt) : null,
          preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : null,
          preferredTimeSlot: dto.preferredTimeSlot,
          addressId,
          cityId: dto.address.cityId,
          districtId: dto.address.districtId,
          neighborhoodId: dto.address.neighborhoodId ?? null,
          latitude: dto.address.location?.latitude ?? null,
          longitude: dto.address.location?.longitude ?? null,
          publishedAt: publish ? now : null,
          expiresAt: publish ? this.expiryFrom(now) : null,
          ...(dto.attachmentFileIds.length > 0
            ? {
                attachments: {
                  create: dto.attachmentFileIds.map((fileId, index) => ({
                    fileId,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: jobRequestInclude,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobRequestId: job.id,
          fromStatus: null,
          toStatus: status,
          changedByUserId: user.id,
        },
      });

      return job;
    });

    // Eşleşme, işlem commit edildikten sonra duyurulur; eşleşen yoksa sessizce geçer.
    if (publish) await this.notifyMatchingProviders(created);
    this.fraud?.observeRequests(user.id, created.id);

    return this.present(created, true);
  }

  /** Müşterinin kendi talepleri. */
  async listMine(
    user: AuthenticatedUser,
    query: ListJobsQueryDto,
  ): Promise<PaginatedResult<JobRequest>> {
    const where: Prisma.JobRequestWhereInput = {
      customerId: user.id,
      deletedAt: null,
      ...(query.status?.length ? { status: { in: query.status } } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.jobRequest.findMany({
        where,
        include: jobRequestInclude,
        orderBy: query.toOrderBy(SORTABLE_FIELDS),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.jobRequest.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => this.present(row, true)),
      total,
      query.page,
      query.limit,
    );
  }

  /**
   * Satıcıya açık iş havuzu. Varsayılan olarak satıcının verdiği hizmetler ve
   * hizmet bölgeleriyle sınırlanır; kendi teklifini verdiği işler listeden düşer.
   */
  async listAvailable(
    user: AuthenticatedUser,
    query: AvailableJobsQueryDto,
  ): Promise<PaginatedResult<JobRequest>> {
    const profile = await this.requireProviderProfile(user.id);

    const where: Prisma.JobRequestWhereInput = {
      deletedAt: null,
      status: { in: OPEN_TO_PROVIDERS },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      offers: { none: { providerProfileId: profile.id } },
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.districtId ? { districtId: query.districtId } : {}),
      ...(query.isUrgent === undefined ? {} : { isUrgent: query.isUrgent }),
    };

    if (query.matchMyServices) {
      const categoryIds = profile.services.map((service) => service.categoryId);
      const districtIds = profile.serviceAreas.map((area) => area.districtId);

      // Hizmet veya bölge tanımlanmamışsa eşleşme yapılamaz; boş liste dönülür.
      if (categoryIds.length === 0 || districtIds.length === 0) {
        return PaginatedResult.of([], 0, query.page, query.limit);
      }

      where.categoryId = query.categoryId ?? { in: categoryIds };
      where.districtId = query.districtId ?? { in: districtIds };
    }

    const [rows, total] = await Promise.all([
      this.prisma.jobRequest.findMany({
        where,
        include: jobRequestInclude,
        orderBy: [{ isUrgent: 'desc' }, { publishedAt: 'desc' }],
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.jobRequest.count({ where }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => this.present(row, false)),
      total,
      query.page,
      query.limit,
    );
  }

  async getById(user: AuthenticatedUser, id: string): Promise<JobRequest> {
    const row = await this.prisma.jobRequest.findFirst({
      where: { id, deletedAt: null },
      include: jobRequestInclude,
    });

    if (!row) throw AppException.notFound('İş talebi', id);

    const isOwner = row.customerId === user.id;
    if (isOwner) return this.present(row, true);

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return this.present(row, true);
    }

    // Alıcı/satıcı ayrımı yok: herkes havuzdaki açık işi görebilir.
    // İşi üstlenen taraf talebi kapandıktan sonra da açık adrese erişir.
    if (await this.isAssignedProvider(user.id, id)) return this.present(row, true);

    if (!OPEN_TO_PROVIDERS.includes(row.status)) {
      throw AppException.forbiddenResource('İş talebi', { jobId: id });
    }
    return this.present(row, false);
  }

  async publish(user: AuthenticatedUser, id: string): Promise<JobRequest> {
    const row = await this.requireOwnedJob(user, id);
    this.assertTransition(row.status, JobRequestStatus.PUBLISHED);

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const job = await tx.jobRequest.update({
        where: { id },
        data: {
          status: JobRequestStatus.PUBLISHED,
          publishedAt: now,
          expiresAt: this.expiryFrom(now),
        },
        include: jobRequestInclude,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobRequestId: id,
          fromStatus: row.status,
          toStatus: JobRequestStatus.PUBLISHED,
          changedByUserId: user.id,
        },
      });

      return job;
    });

    await this.notifyMatchingProviders(updated);

    return this.present(updated, true);
  }

  async cancel(user: AuthenticatedUser, id: string, reason?: string): Promise<JobRequest> {
    const row = await this.requireOwnedJob(user, id);
    this.assertTransition(row.status, JobRequestStatus.CANCELLED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const job = await tx.jobRequest.update({
        where: { id },
        data: { status: JobRequestStatus.CANCELLED },
        include: jobRequestInclude,
      });

      await tx.jobStatusHistory.create({
        data: {
          jobRequestId: id,
          fromStatus: row.status,
          toStatus: JobRequestStatus.CANCELLED,
          changedByUserId: user.id,
          note: reason ?? null,
        },
      });

      return job;
    });

    return this.present(updated, true);
  }

  private present(row: JobRequestRow, revealAddress: boolean): JobRequest {
    return toJobRequest(row, { revealAddress, fileBaseUrl: this.fileBaseUrl });
  }

  /**
   * Kategori ve ilçe hizmet alanında olan satıcılara eşleşme bildirimi gönderir.
   * Alıcı yoksa hiçbir şey yapılmaz.
   */
  private async notifyMatchingProviders(job: JobRequestRow): Promise<void> {
    const providers = await this.prisma.providerProfile.findMany({
      where: {
        deletedAt: null,
        services: { some: { categoryId: job.categoryId } },
        serviceAreas: { some: { districtId: job.districtId } },
      },
      select: { userId: true },
    });

    if (providers.length === 0) return;

    await this.notifications.dispatchAll(
      providers.map((provider) => ({
        userId: provider.userId,
        type: NotificationType.JOB_MATCHED,
        params: {
          jobTitle: job.title,
          categoryName: job.category.name,
          districtName: job.district.name,
        },
        deepLink: deepLinks.job(job.id),
      })),
    );
  }

  private get fileBaseUrl(): string {
    return this.config.fileBaseUrl;
  }

  private expiryFrom(start: Date): Date {
    return new Date(start.getTime() + JOB.defaultExpiryDays * 24 * 60 * 60 * 1000);
  }

  private assertTransition(from: JobRequestStatus, to: JobRequestStatus): void {
    if (canTransitionJobStatus(from, to)) return;

    throw new AppException('JOB_INVALID_STATUS_TRANSITION', {
      message: `Talep "${from}" durumundayken bu işlem yapılamaz.`,
      context: { from, to },
    });
  }

  private async requireOwnedJob(user: AuthenticatedUser, id: string): Promise<JobRequestRow> {
    const row = await this.prisma.jobRequest.findFirst({
      where: { id, deletedAt: null },
      include: jobRequestInclude,
    });

    if (!row) throw AppException.notFound('İş talebi', id);
    if (row.customerId !== user.id) {
      throw AppException.forbiddenResource('İş talebi', { jobId: id });
    }

    return row;
  }

  /** Satıcının bu işte kabul edilmiş teklifi var mı? */
  private async isAssignedProvider(userId: string, jobId: string): Promise<boolean> {
    const order = await this.prisma.order.findFirst({
      where: { jobRequestId: jobId, deletedAt: null, providerProfile: { userId } },
      select: { id: true },
    });

    return order !== null;
  }

  private async requireProviderProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: {
        id: true,
        services: { select: { categoryId: true } },
        serviceAreas: { select: { districtId: true } },
      },
    });

    if (!profile) {
      throw new AppException('PROVIDER_PROFILE_INCOMPLETE', {
        message: 'Bu işlem için satıcı profiliniz olmalıdır.',
      });
    }

    return profile;
  }

  private async assertCategoryExists(categoryId: string, subcategoryId?: string): Promise<void> {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: categoryId, deletedAt: null, isActive: true },
      select: { id: true },
    });

    if (!category) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Seçilen kategori bulunamadı.',
        details: [{ field: 'categoryId', issue: 'Geçersiz kategori' }],
      });
    }

    if (!subcategoryId) return;

    const subcategory = await this.prisma.serviceSubcategory.findFirst({
      where: { id: subcategoryId, categoryId, deletedAt: null, isActive: true },
      select: { id: true },
    });

    if (!subcategory) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Alt kategori seçilen kategoriye ait değil.',
        details: [{ field: 'subcategoryId', issue: 'Geçersiz alt kategori' }],
      });
    }
  }

  private async assertDistrictBelongsToCity(cityId: string, districtId: string): Promise<void> {
    const district = await this.prisma.district.findFirst({
      where: { id: districtId, cityId, isActive: true },
      select: { id: true },
    });

    if (!district) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'Seçilen ilçe bu şehre ait değil.',
        details: [{ field: 'address.districtId', issue: 'Geçersiz ilçe' }],
      });
    }
  }

  /**
   * Açık adres girildiyse adres defterinde bir kayıt oluşturur. Aynı adresi
   * tekrar tekrar yazmamak için birebir eşleşen kayıt varsa o kullanılır.
   */
  private async resolveAddressId(userId: string, dto: CreateJobDto): Promise<string | null> {
    const addressLine = dto.address.addressLine;
    if (!addressLine) return null;

    const existing = await this.prisma.address.findFirst({
      where: {
        userId,
        deletedAt: null,
        cityId: dto.address.cityId,
        districtId: dto.address.districtId,
        neighborhoodId: dto.address.neighborhoodId ?? null,
        addressLine,
      },
      select: { id: true },
    });

    if (existing) return existing.id;

    const created = await this.prisma.address.create({
      data: {
        userId,
        title: 'İş adresi',
        cityId: dto.address.cityId,
        districtId: dto.address.districtId,
        neighborhoodId: dto.address.neighborhoodId ?? null,
        addressLine,
        latitude: dto.address.location?.latitude ?? null,
        longitude: dto.address.location?.longitude ?? null,
      },
      select: { id: true },
    });

    return created.id;
  }
}
