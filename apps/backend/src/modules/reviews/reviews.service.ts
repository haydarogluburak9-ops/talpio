import { Injectable } from '@nestjs/common';
import { canReviewOrder } from '@ustapilot/business-logic';
import { deepLinks } from '@ustapilot/config';
import {
  NotificationType,
  OrderStatus,
  ReviewStatus,
  UserRole,
  type Review,
} from '@ustapilot/types';

import type { Prisma } from '@/generated/prisma/client';
import { PaymentStatus } from '@/generated/prisma/client';
import { PaginatedResult } from '@common/dto/api-response.dto';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';
import { NotificationsService } from '@modules/notifications/notifications.service';

import type { CreateReviewDto, ReplyToReviewDto } from './dto/create-review.dto';
import type {
  ListProviderReviewsQueryDto,
  ListReviewsQueryDto,
} from './dto/list-reviews-query.dto';
import { reviewInclude, toReview, type ReviewRow } from './review.mapper';

const SORTABLE_FIELDS = ['createdAt', 'overallRating'] as const;

/** Ödemesi tahsil edilmiş sayılan durumlar; iade edilen ödeme yorum hakkı vermez. */
const SETTLED_PAYMENTS: PaymentStatus[] = [PaymentStatus.CAPTURED, PaymentStatus.AUTHORIZED];

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Müşteri tamamlanmış bir işi değerlendirir.
   *
   * Yetki `canReviewOrder` ile tek yerden kararlaştırılır. `Review.orderId`
   * veritabanında benzersizdir; böylece eşzamanlı iki istek çift yorum
   * oluşturamaz.
   */
  async create(user: AuthenticatedUser, dto: CreateReviewDto): Promise<Review> {
    // Kimlik tahmin eden birinin yabancı dosyayı kendi yorumuna iliştirmesi engellenir.
    await this.files.assertOwnedBy(user.id, dto.photoFileIds);

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null },
      select: {
        id: true,
        customerId: true,
        providerProfileId: true,
        status: true,
        providerProfile: { select: { userId: true } },
        payments: { where: { status: { in: SETTLED_PAYMENTS } }, select: { id: true }, take: 1 },
        review: { select: { id: true } },
      },
    });

    if (!order) throw AppException.notFound('Sipariş', dto.orderId);

    const allowed = canReviewOrder({
      actor: { userId: user.id, role: user.role },
      orderCustomerId: order.customerId,
      orderStatus: order.status,
      hasPaymentRecord: order.payments.length > 0,
      hasExistingReview: order.review !== null,
    });

    if (!allowed) {
      throw new AppException(order.review ? 'REVIEW_ALREADY_EXISTS' : 'REVIEW_NOT_ALLOWED', {
        message: reviewRefusal(order.review !== null, order.status, order.payments.length > 0),
        context: { orderId: order.id, status: order.status },
      });
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          orderId: order.id,
          customerId: user.id,
          providerProfileId: order.providerProfileId,
          status: ReviewStatus.PUBLISHED,
          ratingQuality: dto.ratings.quality,
          ratingPunctuality: dto.ratings.punctuality,
          ratingCommunication: dto.ratings.communication,
          ratingValue: dto.ratings.valueForMoney,
          ratingTidiness: dto.ratings.tidiness,
          overallRating: averageOf(dto.ratings),
          comment: dto.comment ?? null,
          photoFileIds: dto.photoFileIds,
        },
        include: reviewInclude,
      });

      await this.refreshProviderRating(tx, order.providerProfileId);

      return review;
    });

    const review = await this.present(created);

    await this.notifications.dispatch({
      userId: order.providerProfile.userId,
      type: NotificationType.REVIEW_RECEIVED,
      params: {
        customerName: review.customer?.displayName ?? 'Müşteri',
        rating: review.overallRating,
      },
      deepLink: deepLinks.reviews(),
    });

    return review;
  }

  /** Oturumdaki tarafın değerlendirmeleri: müşteri yazdıklarını, usta aldıklarını görür. */
  async listMine(
    user: AuthenticatedUser,
    query: ListReviewsQueryDto,
  ): Promise<PaginatedResult<Review>> {
    const where: Prisma.ReviewWhereInput = {
      deletedAt: null,
      ...(query.orderId ? { orderId: query.orderId } : {}),
      ...(await this.scopeFor(user)),
    };

    return this.paginate(where, query);
  }

  /**
   * Ustanın herkese açık yorumları.
   *
   * Giriş yapmamış ziyaretçi de usta profilinde yorumları görebildiği için
   * yalnızca yayınlanmış kayıtlar döner; moderasyondaki ve gizlenmiş yorumlar
   * hiçbir çağırana gösterilmez.
   */
  async listForProvider(
    providerProfileId: string,
    query: ListProviderReviewsQueryDto,
  ): Promise<PaginatedResult<Review>> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { id: providerProfileId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) throw AppException.notFound('Usta profili', providerProfileId);

    return this.paginate(
      { providerProfileId, status: ReviewStatus.PUBLISHED, deletedAt: null },
      query,
    );
  }

  async getById(user: AuthenticatedUser, id: string): Promise<Review> {
    return this.present(await this.requireVisibleReview(user, id));
  }

  /**
   * Usta aldığı yoruma cevap yazar.
   *
   * Bir yoruma tek cevap düşer (`ReviewReply.reviewId` benzersiz). İkinci
   * istek 409 yerine mevcut cevabı günceller: ayrı bir düzenleme ucu yoktur ve
   * şemadaki `updatedAt` alanı cevabın değişebileceğini varsayar; ustanın bir
   * yazım hatasını kalıcı olarak taşıması cezalandırıcı olurdu.
   */
  async reply(user: AuthenticatedUser, id: string, dto: ReplyToReviewDto): Promise<Review> {
    const row = await this.findReview(id);

    const profile = await this.requireProviderProfile(user.id);

    if (row.providerProfileId !== profile.id) {
      throw AppException.forbiddenResource('Değerlendirme', { reviewId: id });
    }

    await this.prisma.reviewReply.upsert({
      where: { reviewId: id },
      create: { reviewId: id, body: dto.body },
      update: { body: dto.body, deletedAt: null },
    });

    return this.present(await this.findReview(id));
  }

  private async paginate(
    where: Prisma.ReviewWhereInput,
    query: ListReviewsQueryDto,
  ): Promise<PaginatedResult<Review>> {
    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: reviewInclude,
        orderBy: query.toOrderBy(SORTABLE_FIELDS),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    const storageKeys = await this.resolveStorageKeys(rows);

    return PaginatedResult.of(
      rows.map((row) => toReview(row, { fileBaseUrl: this.fileBaseUrl, storageKeys })),
      total,
      query.page,
      query.limit,
    );
  }

  private async present(row: ReviewRow): Promise<Review> {
    return toReview(row, {
      fileBaseUrl: this.fileBaseUrl,
      storageKeys: await this.resolveStorageKeys([row]),
    });
  }

  /** Fotoğraf kimlikleri ilişki taşımadığı için depo anahtarları toplu çözülür. */
  private async resolveStorageKeys(rows: ReviewRow[]): Promise<Map<string, string>> {
    const fileIds = [...new Set(rows.flatMap((row) => row.photoFileIds))];
    if (fileIds.length === 0) return new Map();

    const files = await this.prisma.fileAsset.findMany({
      where: { id: { in: fileIds }, deletedAt: null },
      select: { id: true, storageKey: true },
    });

    return new Map(files.map((file) => [file.id, file.storageKey]));
  }

  private get fileBaseUrl(): string {
    return this.config.fileBaseUrl;
  }

  private isStaff(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
  }

  /** Rol bazlı liste süzgeci. */
  private async scopeFor(user: AuthenticatedUser): Promise<Prisma.ReviewWhereInput> {
    if (this.isStaff(user.role)) return {};

    if (user.role === UserRole.PROVIDER) {
      const profile = await this.requireProviderProfile(user.id);
      return { providerProfileId: profile.id };
    }

    return { customerId: user.id };
  }

  private async requireProviderProfile(userId: string): Promise<{ id: string }> {
    const profile = await this.prisma.providerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      throw new AppException('PROVIDER_PROFILE_INCOMPLETE', {
        message: 'Bu işlem için usta profiliniz olmalıdır.',
      });
    }

    return profile;
  }

  private async findReview(id: string): Promise<ReviewRow> {
    const row = await this.prisma.review.findFirst({
      where: { id, deletedAt: null },
      include: reviewInclude,
    });

    if (!row) throw AppException.notFound('Değerlendirme', id);
    return row;
  }

  /**
   * Yayınlanmış yorum herkese açıktır; moderasyondaki veya gizlenmiş yorumu
   * yalnızca yazarı, hakkında yazılan usta ve personel görebilir.
   */
  private async requireVisibleReview(user: AuthenticatedUser, id: string): Promise<ReviewRow> {
    const row = await this.findReview(id);

    if (row.status === ReviewStatus.PUBLISHED) return row;
    if (this.isStaff(user.role)) return row;
    if (row.customerId === user.id) return row;

    if (user.role === UserRole.PROVIDER) {
      const profile = await this.requireProviderProfile(user.id);
      if (row.providerProfileId === profile.id) return row;
    }

    throw AppException.forbiddenResource('Değerlendirme', { reviewId: id });
  }

  /**
   * Ustanın ortalama puanı ve yorum sayısı önbellek alanlarıdır.
   *
   * Sayaç körlemesine artırılmaz; yayınlanmış yorumlar üzerinden yeniden
   * hesaplanır. Böylece bir yorum moderasyonda gizlendiğinde veya geri
   * yayınlandığında profil kendiliğinden tutarlı kalır.
   */
  private async refreshProviderRating(
    tx: Prisma.TransactionClient,
    providerProfileId: string,
  ): Promise<void> {
    const aggregate = await tx.review.aggregate({
      where: { providerProfileId, status: ReviewStatus.PUBLISHED, deletedAt: null },
      _avg: { overallRating: true },
      _count: { _all: true },
    });

    const average = aggregate._avg.overallRating;

    await tx.providerProfile.update({
      where: { id: providerProfileId },
      data: {
        averageRating: average === null ? null : round2(Number(average)),
        reviewCount: aggregate._count._all,
      },
    });
  }
}

/** Genel puan beş alt puanın ortalamasıdır; sütun iki ondalık tutar. */
function averageOf(ratings: CreateReviewDto['ratings']): number {
  const values = [
    ratings.quality,
    ratings.punctuality,
    ratings.communication,
    ratings.valueForMoney,
    ratings.tidiness,
  ];

  return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Reddin sebebini kullanıcının anlayacağı dile çevirir. */
function reviewRefusal(hasReview: boolean, status: OrderStatus, hasPayment: boolean): string {
  if (hasReview) return 'Bu iş için zaten bir değerlendirme yaptınız.';
  if (status !== OrderStatus.COMPLETED) {
    return 'Değerlendirme yalnızca tamamlanıp onaylanmış işler için yapılabilir.';
  }
  if (!hasPayment) return 'Ödemesi tamamlanmamış bir iş değerlendirilemez.';
  return 'Bu işi değerlendirme yetkiniz yok.';
}
