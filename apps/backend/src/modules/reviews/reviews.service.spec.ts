import { OrderStatus, ReviewStatus, UserRole } from '@talpio/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { FilesService } from '@modules/files/files.service';

import type { CreateReviewDto } from './dto/create-review.dto';
import type { ListReviewsQueryDto } from './dto/list-reviews-query.dto';
import type { ReviewRow } from './review.mapper';
import { ReviewsService } from './reviews.service';

const FILE_BASE_URL = 'http://localhost:9000/talpio';
const CUSTOMER_ID = 'customer-1';
const PROVIDER_USER_ID = 'provider-user-1';
const PROFILE_ID = 'profile-1';
const ORDER_ID = '0194a1b2-c3d4-7000-8000-000000000001';
const REVIEW_ID = '0194a1b2-c3d4-7000-8000-000000000002';
const PHOTO_ID = '0194a1b2-c3d4-7000-8000-000000000003';

const customer: AuthenticatedUser = { id: CUSTOMER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const otherCustomer: AuthenticatedUser = {
  id: 'customer-2',
  role: UserRole.CUSTOMER,
  sessionId: 's2',
};
const provider: AuthenticatedUser = {
  id: PROVIDER_USER_ID,
  role: UserRole.PROVIDER,
  sessionId: 's3',
};
const otherProvider: AuthenticatedUser = {
  id: 'provider-user-2',
  role: UserRole.PROVIDER,
  sessionId: 's4',
};
const admin: AuthenticatedUser = { id: 'admin-1', role: UserRole.ADMIN, sessionId: 's5' };

const ratings: CreateReviewDto['ratings'] = {
  quality: 5,
  punctuality: 4,
  communication: 5,
  valueForMoney: 4,
  tidiness: 5,
};

function createDto(overrides: Partial<CreateReviewDto> = {}): CreateReviewDto {
  return { orderId: ORDER_ID, ratings, photoFileIds: [], ...overrides };
}

/** Değerlendirmeye izin veren sipariş: tamamlanmış, ödemesi var, yorumu yok. */
function orderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    customerId: CUSTOMER_ID,
    providerProfileId: PROFILE_ID,
    status: OrderStatus.COMPLETED,
    providerProfile: { userId: 'provider-1' },
    payments: [{ id: 'payment-1' }],
    review: null,
    ...overrides,
  };
}

function reviewRow(overrides: Partial<ReviewRow> = {}): ReviewRow {
  const now = new Date('2026-02-01T09:00:00.000Z');

  return {
    id: REVIEW_ID,
    orderId: ORDER_ID,
    customerId: CUSTOMER_ID,
    providerProfileId: PROFILE_ID,
    status: ReviewStatus.PUBLISHED,
    ratingQuality: 5,
    ratingPunctuality: 4,
    ratingCommunication: 5,
    ratingValue: 4,
    ratingTidiness: 5,
    overallRating: 4.6 as never,
    comment: 'İşini temiz yaptı.',
    photoFileIds: [],
    moderationNote: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    customer: { id: CUSTOMER_ID, fullName: 'Ayşe Demir', avatar: null },
    reply: null,
    ...overrides,
  };
}

type PrismaMock = {
  order: { findFirst: jest.Mock };
  review: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    aggregate: jest.Mock;
  };
  reviewReply: { upsert: jest.Mock };
  providerProfile: { findFirst: jest.Mock; update: jest.Mock };
  fileAsset: { findMany: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    order: { findFirst: jest.fn().mockResolvedValue(orderRow()) },
    review: {
      findFirst: jest.fn().mockResolvedValue(reviewRow()),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(reviewRow()),
      aggregate: jest.fn().mockResolvedValue({ _avg: { overallRating: 4.6 }, _count: { _all: 3 } }),
    },
    reviewReply: { upsert: jest.fn().mockResolvedValue({}) },
    providerProfile: {
      findFirst: jest.fn().mockResolvedValue({ id: PROFILE_ID }),
      update: jest.fn().mockResolvedValue({}),
    },
    fileAsset: { findMany: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn(),
  };

  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));

  return mock;
}

type FilesMock = { assertOwnedBy: jest.Mock };

function createFilesMock(): FilesMock {
  return { assertOwnedBy: jest.fn().mockResolvedValue(undefined) };
}

function createService(prisma: PrismaMock, files: FilesMock = createFilesMock()): ReviewsService {
  const config = { fileBaseUrl: FILE_BASE_URL } as unknown as AppConfigService;

  const notifications = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchAll: jest.fn().mockResolvedValue(undefined),
  };

  return new ReviewsService(
    prisma as unknown as PrismaService,
    config,
    files as unknown as FilesService,
    notifications as never,
  );
}

/** `skip` ve `toOrderBy` prototip üzerinde olduğundan gerçek DTO örneği kurulur. */
function listQuery(overrides: Record<string, unknown> = {}): ListReviewsQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

/** Mock çağrı argümanı `any` olduğundan okumadan önce beklenen şekle daraltılır. */
function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
}

/**
 * Taraf süzgeci tek bir `OR` dalında toplanır: aynı kişi hem müşteri hem satıcı
 * olabildiği için sorgu iki tarafı da kapsar.
 */
function scopeOf(mock: jest.Mock): unknown {
  return firstCallArg<{ where: { OR?: unknown } }>(mock).where.OR;
}

async function codeOfRejection(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

describe('ReviewsService', () => {
  let prisma: PrismaMock;
  let files: FilesMock;
  let service: ReviewsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    files = createFilesMock();
    service = createService(prisma, files);
  });

  describe('değerlendirme oluşturma', () => {
    it('tamamlanmış işe yorum yazdırır', async () => {
      await service.create(customer, createDto());

      const { data } = firstCallArg<{ data: { orderId: string; status: string } }>(
        prisma.review.create,
      );
      expect(data.orderId).toBe(ORDER_ID);
      expect(data.status).toBe(ReviewStatus.PUBLISHED);
    });

    it('genel puanı alt puanların ortalaması olarak saklar', async () => {
      await service.create(customer, createDto());

      const { data } = firstCallArg<{ data: { overallRating: number } }>(prisma.review.create);
      expect(data.overallRating).toBe(4.6);
    });

    it('küsuratlı ortalamayı iki ondalığa yuvarlar', async () => {
      await service.create(
        customer,
        createDto({
          ratings: {
            quality: 5,
            punctuality: 5,
            communication: 4,
            valueForMoney: 4,
            tidiness: 4,
          },
        }),
      );

      const { data } = firstCallArg<{ data: { overallRating: number } }>(prisma.review.create);
      expect(data.overallRating).toBe(4.4);
    });

    it('başkasının siparişine yorum yazdırmaz', async () => {
      await expect(codeOfRejection(() => service.create(otherCustomer, createDto()))).resolves.toBe(
        'REVIEW_NOT_ALLOWED',
      );
    });

    it('tamamlanmamış işi değerlendirtmez', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ status: OrderStatus.AWAITING_APPROVAL }));

      await expect(codeOfRejection(() => service.create(customer, createDto()))).resolves.toBe(
        'REVIEW_NOT_ALLOWED',
      );
    });

    it('ödeme kaydı olmayan işi değerlendirtmez', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ payments: [] }));

      await expect(codeOfRejection(() => service.create(customer, createDto()))).resolves.toBe(
        'REVIEW_NOT_ALLOWED',
      );
    });

    it('aynı işe ikinci yorumu reddeder', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow({ review: { id: REVIEW_ID } }));

      await expect(codeOfRejection(() => service.create(customer, createDto()))).resolves.toBe(
        'REVIEW_ALREADY_EXISTS',
      );
    });

    it('bulunamayan siparişte 404 üretir', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.create(customer, createDto()))).resolves.toBe(
        'NOT_FOUND',
      );
    });

    it('başkasının fotoğrafını iliştirmeye izin vermez', async () => {
      files.assertOwnedBy.mockRejectedValue(AppException.forbiddenResource('Dosya'));

      await expect(
        codeOfRejection(() => service.create(customer, createDto({ photoFileIds: [PHOTO_ID] }))),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
      expect(prisma.review.create).not.toHaveBeenCalled();
    });
  });

  describe('satıcı puan önbelleği', () => {
    it('ortalamayı yayınlanmış yorumlar üzerinden yeniden hesaplar', async () => {
      await service.create(customer, createDto());

      const { where } = firstCallArg<{ where: { status: string } }>(prisma.review.aggregate);
      expect(where.status).toBe(ReviewStatus.PUBLISHED);

      const { data } = firstCallArg<{ data: { averageRating: number; reviewCount: number } }>(
        prisma.providerProfile.update,
      );
      expect(data.averageRating).toBe(4.6);
      expect(data.reviewCount).toBe(3);
    });

    it('sayacı körlemesine artırmaz, aggregate sonucunu yazar', async () => {
      prisma.review.aggregate.mockResolvedValue({
        _avg: { overallRating: 3.25 },
        _count: { _all: 8 },
      });

      await service.create(customer, createDto());

      const { data } = firstCallArg<{ data: { averageRating: number; reviewCount: number } }>(
        prisma.providerProfile.update,
      );
      expect(data.averageRating).toBe(3.25);
      expect(data.reviewCount).toBe(8);
    });

    it('yayınlanmış yorum kalmadıysa ortalamayı boşaltır', async () => {
      prisma.review.aggregate.mockResolvedValue({
        _avg: { overallRating: null },
        _count: { _all: 0 },
      });

      await service.create(customer, createDto());

      const { data } = firstCallArg<{ data: { averageRating: number | null } }>(
        prisma.providerProfile.update,
      );
      expect(data.averageRating).toBeNull();
    });
  });

  describe('satıcı cevabı', () => {
    it('yorumun satıcısı cevap yazabilir', async () => {
      await service.reply(provider, REVIEW_ID, { body: 'Teşekkür ederiz.' });

      const args = firstCallArg<{ create: { body: string }; update: { body: string } }>(
        prisma.reviewReply.upsert,
      );
      expect(args.create.body).toBe('Teşekkür ederiz.');
    });

    it('ikinci cevapta mevcut kaydı günceller', async () => {
      await service.reply(provider, REVIEW_ID, { body: 'Düzeltilmiş cevap.' });

      const args = firstCallArg<{ update: { body: string } }>(prisma.reviewReply.upsert);
      expect(args.update.body).toBe('Düzeltilmiş cevap.');
    });

    it('başka satıcının yorumuna cevap yazdırmaz', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({ id: 'profile-2' });

      await expect(
        codeOfRejection(() => service.reply(otherProvider, REVIEW_ID, { body: 'Cevap' })),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
      expect(prisma.reviewReply.upsert).not.toHaveBeenCalled();
    });

    it('satıcı profili olmayan hesaba cevap yazdırmaz', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(
        codeOfRejection(() => service.reply(provider, REVIEW_ID, { body: 'Cevap' })),
      ).resolves.toBe('PROVIDER_PROFILE_INCOMPLETE');
    });

    it('bulunamayan yoruma cevap yazdırmaz', async () => {
      prisma.review.findFirst.mockResolvedValue(null);

      await expect(
        codeOfRejection(() => service.reply(provider, REVIEW_ID, { body: 'Cevap' })),
      ).resolves.toBe('NOT_FOUND');
    });
  });

  describe('listeleme ve görüntüleme', () => {
    it('satıcı profili olmayan müşteriye yalnızca kendi yazdıklarını sorgular', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await service.listMine(customer, listQuery());

      expect(scopeOf(prisma.review.findMany)).toEqual([{ customerId: CUSTOMER_ID }]);
    });

    it('satıcıya hem aldığı hem yazdığı yorumları sorgular', async () => {
      await service.listMine(provider, listQuery());

      expect(scopeOf(prisma.review.findMany)).toEqual([
        { customerId: PROVIDER_USER_ID },
        { providerProfileId: PROFILE_ID },
      ]);
    });

    it('personele taraf süzgeci uygulamaz', async () => {
      await service.listMine(admin, listQuery());

      const { where } = firstCallArg<{
        where: { OR?: unknown; customerId?: string; providerProfileId?: string };
      }>(prisma.review.findMany);
      expect(where.OR).toBeUndefined();
      expect(where.customerId).toBeUndefined();
      expect(where.providerProfileId).toBeUndefined();
    });

    it('herkese açık listede yalnızca yayınlanmış yorumları sorgular', async () => {
      await service.listForProvider(PROFILE_ID, listQuery());

      const { where } = firstCallArg<{ where: { status: string } }>(prisma.review.findMany);
      expect(where.status).toBe(ReviewStatus.PUBLISHED);
    });

    it('bulunamayan satıcı için 404 üretir', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(
        codeOfRejection(() => service.listForProvider(PROFILE_ID, listQuery())),
      ).resolves.toBe('NOT_FOUND');
    });

    it('müşterinin soyadını baş harfe indirir', async () => {
      const review = await service.getById(customer, REVIEW_ID);

      expect(review.customer?.displayName).toBe('Ayşe D.');
    });

    it('gizlenmiş yorumu ilgisiz kullanıcıya göstermez', async () => {
      prisma.review.findFirst.mockResolvedValue(reviewRow({ status: ReviewStatus.HIDDEN }));
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.getById(otherCustomer, REVIEW_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });

    it('gizlenmiş yorumu aldığı satıcıya gösterir', async () => {
      prisma.review.findFirst.mockResolvedValue(reviewRow({ status: ReviewStatus.HIDDEN }));

      const review = await service.getById(provider, REVIEW_ID);

      expect(review.id).toBe(REVIEW_ID);
    });

    it('gizlenmiş yorumu yazarına gösterir', async () => {
      prisma.review.findFirst.mockResolvedValue(reviewRow({ status: ReviewStatus.HIDDEN }));

      const review = await service.getById(customer, REVIEW_ID);
      expect(review.status).toBe(ReviewStatus.HIDDEN);
    });

    it('fotoğraf kimliklerini erişilebilir adrese çevirir', async () => {
      prisma.review.findFirst.mockResolvedValue(reviewRow({ photoFileIds: [PHOTO_ID] }));
      prisma.fileAsset.findMany.mockResolvedValue([
        { id: PHOTO_ID, storageKey: 'reviews/abc.jpg' },
      ]);

      const review = await service.getById(customer, REVIEW_ID);
      expect(review.photoUrls).toEqual([`${FILE_BASE_URL}/reviews/abc.jpg`]);
    });

    it('silinmiş dosyayı kırık bağlantı olarak basmaz', async () => {
      prisma.review.findFirst.mockResolvedValue(reviewRow({ photoFileIds: [PHOTO_ID] }));
      prisma.fileAsset.findMany.mockResolvedValue([]);

      const review = await service.getById(customer, REVIEW_ID);
      expect(review.photoUrls).toEqual([]);
    });
  });
});
