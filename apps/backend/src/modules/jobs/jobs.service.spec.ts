import { JobRequestStatus, JobSize, JobTimeSlot, UserRole } from '@talpio/types';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';
import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { FilesService } from '@modules/files/files.service';

import type { CreateJobDto } from './dto/create-job.dto';
import type { AvailableJobsQueryDto, ListJobsQueryDto } from './dto/list-jobs-query.dto';
import type { JobRequestRow } from './job.mapper';
import { JobsService } from './jobs.service';

const OWNER_ID = 'customer-1';

const owner: AuthenticatedUser = { id: OWNER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const otherCustomer: AuthenticatedUser = {
  id: 'customer-2',
  role: UserRole.CUSTOMER,
  sessionId: 's2',
};
const provider: AuthenticatedUser = { id: 'provider-1', role: UserRole.PROVIDER, sessionId: 's3' };
const admin: AuthenticatedUser = { id: 'admin-1', role: UserRole.ADMIN, sessionId: 's4' };

function jobRow(overrides: Partial<JobRequestRow> = {}): JobRequestRow {
  const now = new Date('2026-01-10T09:00:00.000Z');

  return {
    id: '0194a1b2-c3d4-7000-8000-000000000001',
    customerId: OWNER_ID,
    categoryId: 'cat-1',
    subcategoryId: null,
    title: 'Mutfak musluğu damlatıyor',
    description: 'Evye altındaki bağlantıdan sürekli su sızıyor, zemin ıslanıyor.',
    status: JobRequestStatus.PUBLISHED,
    isUrgent: false,
    size: JobSize.SMALL,
    materialsIncluded: null,
    inspectionRequired: false,
    budgetMinor: 150000,
    currency: 'TRY',
    problemStartedAt: null,
    preferredDate: null,
    preferredTimeSlot: JobTimeSlot.FLEXIBLE,
    addressId: 'address-1',
    cityId: 'city-1',
    districtId: 'district-1',
    neighborhoodId: null,
    latitude: 41.0082 as never,
    longitude: 28.9784 as never,
    offerCount: 0,
    publishedAt: now,
    expiresAt: new Date('2026-01-24T09:00:00.000Z'),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    commerceRequestId: null,
    category: { id: 'cat-1', name: 'Tesisat' },
    subcategory: null,
    city: { name: 'İstanbul' },
    district: { name: 'Kadıköy' },
    neighborhood: null,
    address: { addressLine: 'Caferağa Mah. Moda Cad. No:12 D:4' },
    attachments: [],
    ...overrides,
  };
}

type PrismaMock = {
  jobRequest: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  providerProfile: { findFirst: jest.Mock; findMany: jest.Mock };
  order: { findFirst: jest.Mock };
  serviceCategory: { findFirst: jest.Mock };
  serviceSubcategory: { findFirst: jest.Mock };
  district: { findFirst: jest.Mock };
  address: { findFirst: jest.Mock; create: jest.Mock };
  jobStatusHistory: { create: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const mock: PrismaMock = {
    jobRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    providerProfile: {
      findFirst: jest.fn(),
      // Eşleşme bildirimi için; varsayılan boş liste sessizce geçer.
      findMany: jest.fn().mockResolvedValue([]),
    },
    // İşi üstlenen satıcı kontrolü sipariş tablosuna bakar; varsayılan olarak satıcı atanmamıştır.
    order: { findFirst: jest.fn().mockResolvedValue(null) },
    serviceCategory: { findFirst: jest.fn().mockResolvedValue({ id: 'cat-1' }) },
    serviceSubcategory: { findFirst: jest.fn().mockResolvedValue({ id: 'sub-1' }) },
    district: { findFirst: jest.fn().mockResolvedValue({ id: 'district-1' }) },
    address: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn() },
    jobStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };

  // İşlem geri çağrısı aynı mock istemciyle çalıştırılır.
  mock.$transaction.mockImplementation((fn: (tx: PrismaMock) => unknown) => fn(mock));

  return mock;
}

function createService(prisma: PrismaMock, files: FilesMock = createFilesMock()): JobsService {
  const config = {
    fileBaseUrl: 'http://localhost:9000/talpio',
  } as unknown as AppConfigService;

  const notifications = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchAll: jest.fn().mockResolvedValue(undefined),
  };

  return new JobsService(
    prisma as unknown as PrismaService,
    config,
    files as unknown as FilesService,
    notifications as never,
  );
}

type FilesMock = { assertOwnedBy: jest.Mock };

function createFilesMock(): FilesMock {
  return { assertOwnedBy: jest.fn().mockResolvedValue(undefined) };
}

/** `skip` ve `toOrderBy` prototip üzerinde olduğundan gerçek DTO örneği kurulur. */
function listQuery(overrides: Record<string, unknown> = {}): ListJobsQueryDto {
  return Object.assign(new PaginationQueryDto(), overrides);
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

describe('JobsService', () => {
  let prisma: PrismaMock;
  let service: JobsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = createService(prisma);
  });

  describe('adres gizliliği', () => {
    it('talep sahibine açık adresi ve konumu gösterir', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());

      const result = await service.getById(owner, jobRow().id);

      expect(result.address.isFullyVisible).toBe(true);
      expect(result.address.addressLine).toBe('Caferağa Mah. Moda Cad. No:12 D:4');
      expect(result.address.location).toEqual({ latitude: 41.0082, longitude: 28.9784 });
    });

    it('havuzdaki satıcıya açık adresi ve konumu vermez', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());

      const result = await service.getById(provider, jobRow().id);

      expect(result.address.isFullyVisible).toBe(false);
      expect(result.address.addressLine).toBeUndefined();
      expect(result.address.location).toBeUndefined();
      expect(result.address.districtName).toBe('Kadıköy');
    });

    it('işi üstlenen satıcıya açık adresi verir', async () => {
      // İş bu adreste yapılacaktır; teklif kabul edildikten sonra satıcı adresi görmelidir.
      prisma.jobRequest.findFirst.mockResolvedValue(
        jobRow({ status: JobRequestStatus.PROVIDER_SELECTED }),
      );
      prisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

      const result = await service.getById(provider, jobRow().id);

      expect(result.address.isFullyVisible).toBe(true);
      expect(result.address.addressLine).toBe('Caferağa Mah. Moda Cad. No:12 D:4');
    });
  });

  describe('getById yetkilendirmesi', () => {
    it('başkasının talebini müşteriye göstermez', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());

      await expect(
        codeOfRejection(() => service.getById(otherCustomer, jobRow().id)),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });

    it('teklife kapalı talebi satıcıya göstermez', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow({ status: JobRequestStatus.COMPLETED }));

      await expect(codeOfRejection(() => service.getById(provider, jobRow().id))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });

    it('yöneticiye tam görünürlük verir', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());

      const result = await service.getById(admin, jobRow().id);

      expect(result.address.isFullyVisible).toBe(true);
    });

    it('olmayan talep için NOT_FOUND döner', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.getById(owner, jobRow().id))).resolves.toBe(
        'NOT_FOUND',
      );
    });
  });

  describe('oluşturma', () => {
    const dto: CreateJobDto = {
      categoryId: 'cat-1',
      title: 'Mutfak musluğu damlatıyor',
      description: 'Evye altındaki bağlantıdan sürekli su sızıyor, zemin ıslanıyor.',
      isUrgent: false,
      size: JobSize.SMALL,
      inspectionRequired: false,
      preferredTimeSlot: JobTimeSlot.FLEXIBLE,
      address: { cityId: 'city-1', districtId: 'district-1' },
      attachmentFileIds: [],
      publish: true,
    };

    it('yayınlandığında publishedAt ve son geçerlilik tarihini doldurur', async () => {
      prisma.jobRequest.create.mockResolvedValue(jobRow());

      await service.create(owner, dto);

      const data = prisma.jobRequest.create.mock.calls[0]?.[0]?.data;
      expect(data.status).toBe(JobRequestStatus.PUBLISHED);
      expect(data.publishedAt).toBeInstanceOf(Date);
      expect(data.expiresAt).toBeInstanceOf(Date);
    });

    it('taslak olarak kaydedildiğinde yayın alanlarını boş bırakır', async () => {
      prisma.jobRequest.create.mockResolvedValue(jobRow({ status: JobRequestStatus.DRAFT }));

      await service.create(owner, { ...dto, publish: false });

      const data = prisma.jobRequest.create.mock.calls[0]?.[0]?.data;
      expect(data.status).toBe(JobRequestStatus.DRAFT);
      expect(data.publishedAt).toBeNull();
      expect(data.expiresAt).toBeNull();
    });

    it('durum geçmişine ilk kaydı yazar', async () => {
      prisma.jobRequest.create.mockResolvedValue(jobRow());

      await service.create(owner, dto);

      expect(prisma.jobStatusHistory.create).toHaveBeenCalledWith({
        data: {
          jobRequestId: jobRow().id,
          fromStatus: null,
          toStatus: JobRequestStatus.PUBLISHED,
          changedByUserId: OWNER_ID,
        },
      });
    });

    it('kategori bulunamazsa doğrulama hatası verir', async () => {
      prisma.serviceCategory.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.create(owner, dto))).resolves.toBe(
        'VALIDATION_ERROR',
      );
    });

    it('ilçe seçilen şehre ait değilse doğrulama hatası verir', async () => {
      prisma.district.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.create(owner, dto))).resolves.toBe(
        'VALIDATION_ERROR',
      );
    });

    it('açık adres verilmediğinde adres defterine kayıt açmaz', async () => {
      prisma.jobRequest.create.mockResolvedValue(jobRow());

      await service.create(owner, dto);

      expect(prisma.address.create).not.toHaveBeenCalled();
    });
  });

  describe('iptal', () => {
    it('yayındaki talebi iptal eder ve gerekçeyi geçmişe yazar', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());
      prisma.jobRequest.update.mockResolvedValue(jobRow({ status: JobRequestStatus.CANCELLED }));

      const result = await service.cancel(owner, jobRow().id, 'Kendim hallettim');

      expect(result.status).toBe(JobRequestStatus.CANCELLED);
      expect(prisma.jobStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fromStatus: JobRequestStatus.PUBLISHED,
          toStatus: JobRequestStatus.CANCELLED,
          note: 'Kendim hallettim',
        }),
      });
    });

    it('tamamlanmış talebi iptal etmeyi reddeder', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow({ status: JobRequestStatus.COMPLETED }));

      await expect(codeOfRejection(() => service.cancel(owner, jobRow().id))).resolves.toBe(
        'JOB_INVALID_STATUS_TRANSITION',
      );
    });

    it('başkasının talebini iptal ettirmez', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());

      await expect(codeOfRejection(() => service.cancel(otherCustomer, jobRow().id))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });
  });

  describe('yayına alma', () => {
    it('taslağı yayınlar', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow({ status: JobRequestStatus.DRAFT }));
      prisma.jobRequest.update.mockResolvedValue(jobRow());

      const result = await service.publish(owner, jobRow().id);

      expect(result.status).toBe(JobRequestStatus.PUBLISHED);
    });

    it('zaten yayındaki talebi tekrar yayınlamaz', async () => {
      prisma.jobRequest.findFirst.mockResolvedValue(jobRow());

      await expect(codeOfRejection(() => service.publish(owner, jobRow().id))).resolves.toBe(
        'JOB_INVALID_STATUS_TRANSITION',
      );
    });
  });

  describe('satıcı havuzu', () => {
    function availableQuery(overrides: Record<string, unknown> = {}): AvailableJobsQueryDto {
      return listQuery({ matchMyServices: true, ...overrides }) as AvailableJobsQueryDto;
    }

    it('satıcı profili yoksa hata verir', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(
        codeOfRejection(() => service.listAvailable(provider, availableQuery())),
      ).resolves.toBe('PROVIDER_PROFILE_INCOMPLETE');
    });

    it('hizmet bölgesi tanımlı değilse sorgu çalıştırmadan boş liste döner', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
        services: [{ categoryId: 'cat-1' }],
        serviceAreas: [],
      });

      const result = await service.listAvailable(provider, availableQuery());

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(prisma.jobRequest.findMany).not.toHaveBeenCalled();
    });

    it('satıcının kategori ve bölgeleriyle sınırlar, kendi teklif verdiklerini eler', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
        services: [{ categoryId: 'cat-1' }, { categoryId: 'cat-2' }],
        serviceAreas: [{ districtId: 'district-1' }],
      });

      await service.listAvailable(provider, availableQuery());

      const where = prisma.jobRequest.findMany.mock.calls[0]?.[0]?.where;
      expect(where.categoryId).toEqual({ in: ['cat-1', 'cat-2'] });
      expect(where.districtId).toEqual({ in: ['district-1'] });
      expect(where.offers).toEqual({ none: { providerProfileId: 'profile-1' } });
      expect(where.status).toEqual({
        in: [JobRequestStatus.PUBLISHED, JobRequestStatus.OFFERS_RECEIVED],
      });
    });

    it('eşleştirme kapatıldığında tüm açık talepleri döndürür', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
        services: [],
        serviceAreas: [],
      });

      await service.listAvailable(provider, availableQuery({ matchMyServices: false }));

      const where = prisma.jobRequest.findMany.mock.calls[0]?.[0]?.where;
      expect(where.categoryId).toBeUndefined();
      expect(where.districtId).toBeUndefined();
    });

    it('havuz sonuçlarında açık adres bulunmaz', async () => {
      prisma.providerProfile.findFirst.mockResolvedValue({
        id: 'profile-1',
        services: [{ categoryId: 'cat-1' }],
        serviceAreas: [{ districtId: 'district-1' }],
      });
      prisma.jobRequest.findMany.mockResolvedValue([jobRow()]);
      prisma.jobRequest.count.mockResolvedValue(1);

      const result = await service.listAvailable(provider, availableQuery());

      expect(result.items[0]?.address.addressLine).toBeUndefined();
      expect(result.items[0]?.address.isFullyVisible).toBe(false);
    });
  });

  describe('kendi taleplerim', () => {
    it('yalnızca oturum sahibinin silinmemiş taleplerini sorgular', async () => {
      await service.listMine(owner, listQuery());

      const where = prisma.jobRequest.findMany.mock.calls[0]?.[0]?.where;
      expect(where.customerId).toBe(OWNER_ID);
      expect(where.deletedAt).toBeNull();
    });

    it('durum süzgecini uygular', async () => {
      await service.listMine(
        owner,
        listQuery({ status: [JobRequestStatus.PUBLISHED, JobRequestStatus.COMPLETED] }),
      );

      const where = prisma.jobRequest.findMany.mock.calls[0]?.[0]?.where;
      expect(where.status).toEqual({
        in: [JobRequestStatus.PUBLISHED, JobRequestStatus.COMPLETED],
      });
    });
  });
});
