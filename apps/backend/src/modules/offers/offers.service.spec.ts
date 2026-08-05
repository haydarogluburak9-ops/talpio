import {
  JobRequestStatus,
  OfferPriceType,
  OfferStatus,
  OrderStatus,
  UserRole,
} from '@ustapilot/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import type { CreateOfferDto } from './dto/create-offer.dto';
import type { ListMyOffersQueryDto } from './dto/list-offers-query.dto';
import type { OfferRow } from './offer.mapper';
import { OffersService } from './offers.service';

const CUSTOMER_ID = 'customer-1';
const PROVIDER_ID = 'provider-1';
const PROFILE_ID = 'profile-1';
const JOB_ID = '0194a1b2-c3d4-7000-8000-000000000001';
const OFFER_ID = '0194a1b2-c3d4-7000-8000-000000000002';

const customer: AuthenticatedUser = { id: CUSTOMER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const otherCustomer: AuthenticatedUser = {
  id: 'customer-2',
  role: UserRole.CUSTOMER,
  sessionId: 's2',
};
const provider: AuthenticatedUser = { id: 'provider-1', role: UserRole.PROVIDER, sessionId: 's3' };

const HOUR = 60 * 60 * 1000;

function offerRow(overrides: Partial<OfferRow> = {}): OfferRow {
  const now = new Date('2026-01-10T09:00:00.000Z');

  return {
    id: OFFER_ID,
    jobRequestId: JOB_ID,
    providerProfileId: PROFILE_ID,
    status: OfferStatus.SUBMITTED,
    amountMinor: 250000,
    currency: 'TRY',
    priceType: OfferPriceType.FIXED,
    estimatedDurationMinutes: 120,
    availableFrom: null,
    materialsIncluded: false,
    note: null,
    validUntil: new Date(Date.now() + 24 * HOUR),
    submittedAt: now,
    respondedAt: null,
    rejectionReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    providerProfile: {
      id: PROFILE_ID,
      businessName: 'Yılmaz Tesisat',
      verificationStatus: 'VERIFIED',
      isPremium: false,
      averageRating: 4.6 as never,
      reviewCount: 24,
      completedJobCount: 58,
      averageResponseMinutes: 35,
      user: { fullName: 'Ahmet Yılmaz', avatar: null },
      services: [{ category: { id: 'cat-1', name: 'Tesisat' } }],
    },
    ...overrides,
  };
}

/** Kabul/ret yolunda servis işi ve premium bilgisini birlikte çeker. */
function offerWithJob(
  overrides: {
    offer?: Partial<OfferRow>;
    jobStatus?: JobRequestStatus;
    customerId?: string;
  } = {},
) {
  return {
    ...offerRow(overrides.offer),
    providerProfile: { isPremium: false, userId: PROVIDER_ID },
    jobRequest: {
      id: JOB_ID,
      title: 'Test talep',
      customerId: overrides.customerId ?? CUSTOMER_ID,
      status: overrides.jobStatus ?? JobRequestStatus.OFFERS_RECEIVED,
      categoryId: 'cat-1',
      cityId: 'city-1',
    },
  };
}

type PrismaMock = {
  offer: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  jobRequest: { findFirst: jest.Mock; update: jest.Mock };
  providerProfile: { findFirst: jest.Mock };
  jobStatusHistory: { create: jest.Mock };
  commissionRule: { findMany: jest.Mock };
  order: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    offer: {
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue(offerRow()),
      update: jest.fn().mockResolvedValue(offerRow()),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    jobRequest: {
      findFirst: jest.fn().mockResolvedValue({
        id: JOB_ID,
        title: 'Test talep',
        status: JobRequestStatus.PUBLISHED,
        categoryId: 'cat-1',
        districtId: 'district-1',
        currency: 'TRY',
        expiresAt: new Date(Date.now() + 7 * 24 * HOUR),
        customerId: CUSTOMER_ID,
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    providerProfile: {
      findFirst: jest.fn().mockResolvedValue({
        id: PROFILE_ID,
        verificationStatus: 'VERIFIED',
        services: [{ categoryId: 'cat-1' }],
        serviceAreas: [{ districtId: 'district-1' }],
      }),
    },
    jobStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    commissionRule: { findMany: jest.fn().mockResolvedValue([]) },
    order: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue({
        id: 'order-1',
        jobRequest: { title: 'Test talep' },
        customer: { fullName: 'Ayşe' },
        providerProfile: { userId: PROVIDER_ID },
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(),
  };

  // İşlem geri çağrısı aynı mock istemciyle çalıştırılır.
  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));

  return mock;
}

function createService(prisma: PrismaMock): OffersService {
  const config = {
    fileBaseUrl: 'http://localhost:9000/ustapilot',
  } as unknown as AppConfigService;

  const notifications = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchAll: jest.fn().mockResolvedValue(undefined),
  };

  return new OffersService(prisma as unknown as PrismaService, config, notifications as never);
}

type JobUpdateData = { status?: JobRequestStatus; offerCount?: { increment: number } };
type OfferWhere = {
  providerProfileId?: string;
  jobRequestId?: string;
  deletedAt: Date | null;
  status?: unknown;
};

/** Mock çağrı argümanı `any` olduğundan okumadan önce beklenen şekle daraltılır. */
function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
}

/** `skip` ve `toOrderBy` prototip üzerinde olduğundan gerçek DTO örneği kurulur. */
function listQuery(overrides: Record<string, unknown> = {}): ListMyOffersQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
}

const dto: CreateOfferDto = {
  jobRequestId: JOB_ID,
  amountMinor: 250000,
  priceType: OfferPriceType.FIXED,
  materialsIncluded: false,
  validityHours: 72,
};

async function codeOfRejection(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (error) {
    if (error instanceof AppException) return error.code;
    throw error;
  }

  throw new Error('Beklenen hata fırlatılmadı.');
}

describe('OffersService', () => {
  let prisma: PrismaMock;
  let service: OffersService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  describe('teklif verme', () => {
    it('geçerlilik süresini saat cinsinden ileri tarihe kurar', async () => {
      await service.create(provider, { ...dto, validityHours: 48 });

      const { data } = firstCallArg<{ data: { validUntil: Date; status: OfferStatus } }>(
        prisma.offer.create,
      );
      const hours = (data.validUntil.getTime() - Date.now()) / HOUR;
      expect(Math.round(hours)).toBe(48);
      expect(data.status).toBe(OfferStatus.SUBMITTED);
    });

    it('ilk teklifte talebi "teklifler alındı" durumuna taşır', async () => {
      await service.create(provider, dto);

      const { data } = firstCallArg<{ data: JobUpdateData }>(prisma.jobRequest.update);
      expect(data.status).toBe(JobRequestStatus.OFFERS_RECEIVED);
      expect(data.offerCount).toEqual({ increment: 1 });
      expect(prisma.jobStatusHistory.create).toHaveBeenCalled();
    });

    it('sonraki tekliflerde durumu değiştirmeden sayacı artırır', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue({
        id: JOB_ID,
        status: JobRequestStatus.OFFERS_RECEIVED,
        categoryId: 'cat-1',
        districtId: 'district-1',
        currency: 'TRY',
        expiresAt: null,
      });

      await service.create(provider, dto);

      const { data } = firstCallArg<{ data: JobUpdateData }>(prisma.jobRequest.update);
      expect(data.status).toBeUndefined();
      expect(data.offerCount).toEqual({ increment: 1 });
      expect(prisma.jobStatusHistory.create).not.toHaveBeenCalled();
    });

    it('aynı işe ikinci teklifi engeller', async () => {
      prisma.offer.findFirst.mockResolvedValue({ id: OFFER_ID });

      await expect(codeOfRejection(() => service.create(provider, dto))).resolves.toBe(
        'DUPLICATE_OFFER',
      );
    });

    it('doğrulanmamış ustanın teklif vermesini engeller', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({
        id: PROFILE_ID,
        verificationStatus: 'PENDING',
        services: [{ categoryId: 'cat-1' }],
        serviceAreas: [{ districtId: 'district-1' }],
      });

      await expect(codeOfRejection(() => service.create(provider, dto))).resolves.toBe(
        'PROVIDER_NOT_VERIFIED',
      );
    });

    it('hizmet bölgesi dışındaki işe teklif verdirmez', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({
        id: PROFILE_ID,
        verificationStatus: 'VERIFIED',
        services: [{ categoryId: 'cat-1' }],
        serviceAreas: [{ districtId: 'district-9' }],
      });

      await expect(codeOfRejection(() => service.create(provider, dto))).resolves.toBe(
        'PROVIDER_OUT_OF_SERVICE_AREA',
      );
    });

    it('teklife kapalı talebi reddeder', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue({
        id: JOB_ID,
        status: JobRequestStatus.PROVIDER_SELECTED,
        categoryId: 'cat-1',
        districtId: 'district-1',
        currency: 'TRY',
        expiresAt: null,
      });

      await expect(codeOfRejection(() => service.create(provider, dto))).resolves.toBe(
        'JOB_NOT_OPEN_FOR_OFFERS',
      );
    });

    it('süresi dolmuş talebe teklif verdirmez', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue({
        id: JOB_ID,
        status: JobRequestStatus.PUBLISHED,
        categoryId: 'cat-1',
        districtId: 'district-1',
        currency: 'TRY',
        expiresAt: new Date(Date.now() - HOUR),
      });

      await expect(codeOfRejection(() => service.create(provider, dto))).resolves.toBe(
        'JOB_NOT_OPEN_FOR_OFFERS',
      );
    });

    it('usta profili yoksa hata verir', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.create(provider, dto))).resolves.toBe(
        'PROVIDER_PROFILE_INCOMPLETE',
      );
    });
  });

  describe('teklif kabulü', () => {
    it('rakip teklifleri düşürür ve talebi usta seçildi durumuna taşır', async () => {
      prisma.offer.findFirst.mockResolvedValue(offerWithJob());
      prisma.offer.update.mockResolvedValue(offerRow({ status: OfferStatus.ACCEPTED }));

      const result = await service.accept(customer, OFFER_ID, {});

      expect(result.status).toBe(OfferStatus.ACCEPTED);
      expect(prisma.offer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobRequestId: JOB_ID,
            id: { not: OFFER_ID },
            status: OfferStatus.SUBMITTED,
          }),
          data: expect.objectContaining({ status: OfferStatus.REJECTED }),
        }),
      );
      expect(prisma.jobRequest.update).toHaveBeenCalledWith({
        where: { id: JOB_ID },
        data: { status: JobRequestStatus.PROVIDER_SELECTED },
      });
    });

    it('komisyonu kabul anında dondurup siparişi açar', async () => {
      prisma.offer.findFirst.mockResolvedValue(offerWithJob());
      prisma.offer.update.mockResolvedValue(offerRow({ status: OfferStatus.ACCEPTED }));

      await service.accept(customer, OFFER_ID, {});

      const { data } = firstCallArg<{
        data: {
          status: OrderStatus;
          totalMinor: number;
          commissionMinor: number;
          payoutMinor: number;
        };
      }>(prisma.order.create);
      expect(data.status).toBe(OrderStatus.PENDING_PAYMENT);
      expect(data.totalMinor).toBe(250000);
      // Komisyon ve hakediş daima brüt tutarı bölüşür.
      expect(data.commissionMinor + data.payoutMinor).toBe(250000);
      expect(data.commissionMinor).toBeGreaterThan(0);
    });

    it('süresi dolmuş teklifi kabul ettirmez', async () => {
      prisma.offer.findFirst.mockResolvedValue(
        offerWithJob({ offer: { validUntil: new Date(Date.now() - HOUR) } }),
      );

      await expect(codeOfRejection(() => service.accept(customer, OFFER_ID, {}))).resolves.toBe(
        'OFFER_EXPIRED',
      );
    });

    it('bekleyen olmayan teklifi kabul ettirmez', async () => {
      prisma.offer.findFirst.mockResolvedValue(
        offerWithJob({ offer: { status: OfferStatus.WITHDRAWN } }),
      );

      await expect(codeOfRejection(() => service.accept(customer, OFFER_ID, {}))).resolves.toBe(
        'OFFER_NOT_PENDING',
      );
    });

    it('usta seçilmiş talepte ikinci kabulü engeller', async () => {
      prisma.offer.findFirst.mockResolvedValue(
        offerWithJob({ jobStatus: JobRequestStatus.PROVIDER_SELECTED }),
      );

      await expect(codeOfRejection(() => service.accept(customer, OFFER_ID, {}))).resolves.toBe(
        'JOB_INVALID_STATUS_TRANSITION',
      );
    });

    it('başkasının işine gelen teklifi kabul ettirmez', async () => {
      prisma.offer.findFirst.mockResolvedValue(offerWithJob());

      await expect(
        codeOfRejection(() => service.accept(otherCustomer, OFFER_ID, {})),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });
  });

  describe('teklif reddi', () => {
    it('gerekçeyi kaydeder', async () => {
      prisma.offer.findFirst.mockResolvedValue(offerWithJob());
      prisma.offer.update.mockResolvedValue(offerRow({ status: OfferStatus.REJECTED }));

      await service.reject(customer, OFFER_ID, 'Bütçemin üzerinde');

      const { data } = firstCallArg<{ data: { status: OfferStatus; rejectionReason: string } }>(
        prisma.offer.update,
      );
      expect(data.status).toBe(OfferStatus.REJECTED);
      expect(data.rejectionReason).toBe('Bütçemin üzerinde');
    });
  });

  describe('teklif geri çekme', () => {
    it('ustanın bekleyen teklifini geri çeker', async () => {
      prisma.offer.findFirst.mockResolvedValue({
        id: OFFER_ID,
        providerProfileId: PROFILE_ID,
        status: OfferStatus.SUBMITTED,
      });
      prisma.offer.update.mockResolvedValue(offerRow({ status: OfferStatus.WITHDRAWN }));

      const result = await service.withdraw(provider, OFFER_ID);

      expect(result.status).toBe(OfferStatus.WITHDRAWN);
    });

    it('kabul edilmiş teklifi geri çektirmez', async () => {
      prisma.offer.findFirst.mockResolvedValue({
        id: OFFER_ID,
        providerProfileId: PROFILE_ID,
        status: OfferStatus.ACCEPTED,
      });

      await expect(codeOfRejection(() => service.withdraw(provider, OFFER_ID))).resolves.toBe(
        'OFFER_INVALID_STATUS_TRANSITION',
      );
    });

    it('başka ustanın teklifini geri çektirmez', async () => {
      prisma.offer.findFirst.mockResolvedValue({
        id: OFFER_ID,
        providerProfileId: 'profile-9',
        status: OfferStatus.SUBMITTED,
      });

      await expect(codeOfRejection(() => service.withdraw(provider, OFFER_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('listeleme', () => {
    it('ustaya yalnızca kendi tekliflerini sorgular', async () => {
      await service.listMine(provider, listQuery());

      const { where } = firstCallArg<{ where: OfferWhere }>(prisma.offer.findMany);
      expect(where.providerProfileId).toBe(PROFILE_ID);
      expect(where.deletedAt).toBeNull();
    });

    it('talep sahibine taslak teklifleri göstermez', async () => {
      await service.listForJob(customer, JOB_ID, listQuery());

      const { where } = firstCallArg<{ where: OfferWhere }>(prisma.offer.findMany);
      expect(where.jobRequestId).toBe(JOB_ID);
      expect(where.status).toEqual({ not: OfferStatus.DRAFT });
    });

    it('başkasının talebine gelen teklifleri listeletmez', async () => {
      await expect(
        codeOfRejection(() => service.listForJob(otherCustomer, JOB_ID, listQuery())),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });
  });

  describe('teklif detayı', () => {
    it('talep sahibine gösterir', async () => {
      prisma.offer.findFirst.mockResolvedValue({
        ...offerRow(),
        jobRequest: { customerId: CUSTOMER_ID },
      });

      const result = await service.getById(customer, OFFER_ID);

      expect(result.id).toBe(OFFER_ID);
      expect(result.provider?.displayName).toBe('Yılmaz Tesisat');
    });

    it('ilgisiz müşteriye göstermez', async () => {
      prisma.offer.findFirst.mockResolvedValue({
        ...offerRow(),
        jobRequest: { customerId: CUSTOMER_ID },
      });

      await expect(codeOfRejection(() => service.getById(otherCustomer, OFFER_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });

    it('olmayan teklif için NOT_FOUND döner', async () => {
      prisma.offer.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.getById(customer, OFFER_ID))).resolves.toBe(
        'NOT_FOUND',
      );
    });
  });
});
