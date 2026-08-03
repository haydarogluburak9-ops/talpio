import { UserRole, VerificationStatus } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { ProvidersService } from './providers.service';

const PROFILE_ID = 'provider-1';
const FILE_BASE_URL = 'http://localhost:9000/ustapilot';
const CATEGORY_A = '0194a1b2-c3d4-7000-8000-00000000000a';
const CATEGORY_B = '0194a1b2-c3d4-7000-8000-00000000000b';
const SUBCATEGORY_A = '0194a1b2-c3d4-7000-8000-0000000000aa';
const DISTRICT_A = '0194a1b2-c3d4-7000-8000-0000000000d1';
const DISTRICT_B = '0194a1b2-c3d4-7000-8000-0000000000d2';

const provider: AuthenticatedUser = { id: 'user-1', role: UserRole.PROVIDER, sessionId: 's1' };

function serviceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'service-1',
    providerProfileId: PROFILE_ID,
    categoryId: CATEGORY_A,
    subcategoryId: null,
    startingPriceMinor: 50_000,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: { id: CATEGORY_A, name: 'Tesisat' },
    subcategory: null,
    ...overrides,
  };
}

function profileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PROFILE_ID,
    userId: 'user-1',
    businessName: 'Yılmaz Tesisat',
    about: null,
    experienceYears: 8,
    verificationStatus: VerificationStatus.VERIFIED,
    isPremium: false,
    acceptsUrgentJobs: true,
    canIssueInvoice: false,
    averageRating: null,
    reviewCount: 0,
    completedJobCount: 9,
    cancelledJobCount: 1,
    averageResponseMinutes: 20,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    deletedAt: null,
    user: { fullName: 'Mehmet Yılmaz', avatar: { storageKey: 'avatars/abc.jpg' } },
    services: [serviceRow()],
    serviceAreas: [{ district: { id: DISTRICT_A, name: 'Kadıköy' } }],
    ...overrides,
  };
}

type PrismaMock = {
  providerProfile: { findFirst: jest.Mock; update: jest.Mock };
  providerService: { create: jest.Mock; update: jest.Mock; deleteMany: jest.Mock };
  providerServiceArea: { deleteMany: jest.Mock; createMany: jest.Mock };
  serviceCategory: { findMany: jest.Mock };
  serviceSubcategory: { findMany: jest.Mock };
  district: { count: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    providerProfile: {
      findFirst: jest.fn().mockResolvedValue(profileRow()),
      update: jest.fn().mockResolvedValue(profileRow()),
    },
    providerService: {
      create: jest.fn().mockResolvedValue(serviceRow()),
      update: jest.fn().mockResolvedValue(serviceRow()),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    providerServiceArea: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    serviceCategory: {
      findMany: jest.fn().mockResolvedValue([{ id: CATEGORY_A }, { id: CATEGORY_B }]),
    },
    serviceSubcategory: {
      findMany: jest.fn().mockResolvedValue([{ id: SUBCATEGORY_A, categoryId: CATEGORY_A }]),
    },
    district: { count: jest.fn().mockResolvedValue(2) },
    // Hem geri çağrı hem de dizi biçimini destekler; servis ikisini de kullanır.
    $transaction: jest.fn((arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: PrismaMock) => Promise<unknown>)(prisma)
        : Promise.all(arg as Promise<unknown>[]),
    ),
  };

  return prisma;
}

function createService(prisma: PrismaMock): ProvidersService {
  const config = { fileBaseUrl: FILE_BASE_URL } as unknown as AppConfigService;

  return new ProvidersService(prisma as unknown as PrismaService, config);
}

describe('ProvidersService', () => {
  describe('profil okuma', () => {
    it('istatistikleri ve rozetleri türetir', async () => {
      const result = await createService(createPrismaMock()).getMe(provider);

      expect(result.isVerified).toBe(true);
      expect(result.cancellationRate).toBeCloseTo(0.1);
      expect(result.categories).toEqual([{ id: CATEGORY_A, name: 'Tesisat' }]);
      expect(result.serviceAreas).toEqual([{ id: DISTRICT_A, name: 'Kadıköy' }]);
    });

    it('hiç iş yapmamış ustada iptal oranı sıfırdır', async () => {
      const prisma = createPrismaMock();
      prisma.providerProfile.findFirst.mockResolvedValue(
        profileRow({ completedJobCount: 0, cancelledJobCount: 0 }),
      );

      const result = await createService(prisma).getMe(provider);

      expect(result.cancellationRate).toBe(0);
    });

    it('profili olmayan kullanıcıyı reddeder', async () => {
      const prisma = createPrismaMock();
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(createService(prisma).getMe(provider)).rejects.toThrow(AppException);
    });

    it('herkese açık kartta işletme adını ve görseli gösterir', async () => {
      const result = await createService(createPrismaMock()).getPublicById(PROFILE_ID);

      expect(result.displayName).toBe('Yılmaz Tesisat');
      expect(result.avatarUrl).toBe(`${FILE_BASE_URL}/avatars/abc.jpg`);
    });
  });

  describe('profil güncelleme', () => {
    it('yalnızca gönderilen alanları yazar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateMe(provider, { about: 'On yıllık tesisat deneyimi.' });

      const args = prisma.providerProfile.update.mock.calls[0]?.[0] as {
        data: Record<string, unknown>;
      };
      expect(args.data).toEqual({ about: 'On yıllık tesisat deneyimi.' });
    });

    it('doğrulama durumunu değiştirmez', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateMe(provider, {
        businessName: 'Yılmaz Tesisat A.Ş.',
        acceptsUrgentJobs: false,
      });

      const args = prisma.providerProfile.update.mock.calls[0]?.[0] as {
        data: Record<string, unknown>;
      };
      expect(args.data).not.toHaveProperty('verificationStatus');
      expect(args.data).not.toHaveProperty('isPremium');
    });
  });

  describe('hizmet listesi', () => {
    it('yeni hizmeti ekler, kalanı korur', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).replaceMyServices(provider, {
        services: [
          { categoryId: CATEGORY_A, startingPriceMinor: 50_000 },
          { categoryId: CATEGORY_B },
        ],
      });

      expect(prisma.providerService.create).toHaveBeenCalledTimes(1);
      expect(prisma.providerService.update).not.toHaveBeenCalled();
      expect(prisma.providerService.deleteMany).not.toHaveBeenCalled();
    });

    it('listede olmayan hizmeti siler', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).replaceMyServices(provider, {
        services: [{ categoryId: CATEGORY_B }],
      });

      const args = prisma.providerService.deleteMany.mock.calls[0]?.[0] as {
        where: { id: { in: string[] } };
      };
      expect(args.where.id.in).toEqual(['service-1']);
    });

    it('yalnızca fiyat değiştiyse kaydı günceller', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).replaceMyServices(provider, {
        services: [{ categoryId: CATEGORY_A, startingPriceMinor: 75_000 }],
      });

      expect(prisma.providerService.create).not.toHaveBeenCalled();
      expect(prisma.providerService.update).toHaveBeenCalledTimes(1);
    });

    it('aynı hizmet iki kez gönderilirse tek kayıt yazar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).replaceMyServices(provider, {
        services: [{ categoryId: CATEGORY_B }, { categoryId: CATEGORY_B }],
      });

      expect(prisma.providerService.create).toHaveBeenCalledTimes(1);
    });

    it('bilinmeyen kategoriyi reddeder', async () => {
      const prisma = createPrismaMock();
      prisma.serviceCategory.findMany.mockResolvedValue([{ id: CATEGORY_A }]);

      await expect(
        createService(prisma).replaceMyServices(provider, {
          services: [{ categoryId: CATEGORY_B }],
        }),
      ).rejects.toThrow(AppException);
      expect(prisma.providerService.create).not.toHaveBeenCalled();
    });

    it('başka kategoriye ait alt hizmeti reddeder', async () => {
      const prisma = createPrismaMock();

      await expect(
        createService(prisma).replaceMyServices(provider, {
          services: [{ categoryId: CATEGORY_B, subcategoryId: SUBCATEGORY_A }],
        }),
      ).rejects.toThrow(AppException);
      expect(prisma.providerService.create).not.toHaveBeenCalled();
    });
  });

  describe('hizmet bölgeleri', () => {
    it('bölgeleri gönderilen listeyle değiştirir', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).replaceMyServiceAreas(provider, {
        districtIds: [DISTRICT_A, DISTRICT_B],
      });

      const args = prisma.providerServiceArea.createMany.mock.calls[0]?.[0] as {
        data: { districtId: string }[];
      };
      expect(prisma.providerServiceArea.deleteMany).toHaveBeenCalled();
      expect(args.data.map((row) => row.districtId)).toEqual([DISTRICT_A, DISTRICT_B]);
    });

    it('tekrar eden ilçeyi bir kez yazar', async () => {
      const prisma = createPrismaMock();
      prisma.district.count.mockResolvedValue(1);

      await createService(prisma).replaceMyServiceAreas(provider, {
        districtIds: [DISTRICT_A, DISTRICT_A],
      });

      const args = prisma.providerServiceArea.createMany.mock.calls[0]?.[0] as {
        data: { districtId: string }[];
      };
      expect(args.data).toHaveLength(1);
    });

    it('bilinmeyen ilçeyi reddeder', async () => {
      const prisma = createPrismaMock();
      prisma.district.count.mockResolvedValue(1);

      await expect(
        createService(prisma).replaceMyServiceAreas(provider, {
          districtIds: [DISTRICT_A, DISTRICT_B],
        }),
      ).rejects.toThrow(AppException);
      expect(prisma.providerServiceArea.deleteMany).not.toHaveBeenCalled();
    });
  });
});
