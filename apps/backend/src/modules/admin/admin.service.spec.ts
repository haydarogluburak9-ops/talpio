import { UserRole, UserStatus, VerificationStatus } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { AdminService } from './admin.service';
import type { AuditLogService } from './audit-log.service';
import { ListAdminUsersQueryDto } from './dto/admin-query.dto';

const FILE_BASE_URL = 'http://localhost:9000/ustapilot';
const TARGET_ID = 'user-2';

const admin: AuthenticatedUser = { id: 'admin-1', role: UserRole.ADMIN, sessionId: 's1' };
const superAdmin: AuthenticatedUser = { id: 'root-1', role: UserRole.SUPER_ADMIN, sessionId: 's2' };

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TARGET_ID,
    email: 'musteri@ustapilot.com',
    phone: '+905321234567',
    fullName: 'Ayşe Yılmaz',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    lastActiveAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    avatar: null,
    providerProfile: null,
    ...overrides,
  };
}

function providerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'provider-1',
    userId: 'user-3',
    businessName: 'Yılmaz Tesisat',
    verificationStatus: VerificationStatus.PENDING,
    isPremium: false,
    averageRating: null,
    reviewCount: 0,
    completedJobCount: 4,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    user: { id: 'user-3', email: 'usta@ustapilot.com', fullName: 'Mehmet Yılmaz', avatar: null },
    _count: { services: 2, serviceAreas: 5 },
    documents: [],
    ...overrides,
  };
}

type PrismaMock = {
  user: { findFirst: jest.Mock; findMany: jest.Mock; update: jest.Mock; count: jest.Mock };
  userSession: { updateMany: jest.Mock };
  providerProfile: { findFirst: jest.Mock; update: jest.Mock };
  providerDocument: { updateMany: jest.Mock };
  $transaction: jest.Mock;
};

function createPrismaMock(): PrismaMock {
  const providerProfile = {
    findFirst: jest.fn().mockResolvedValue(providerRow()),
    update: jest.fn().mockResolvedValue(providerRow({ verificationStatus: 'VERIFIED' })),
  };

  return {
    user: {
      findFirst: jest.fn().mockResolvedValue(userRow()),
      findMany: jest.fn().mockResolvedValue([userRow()]),
      update: jest.fn().mockResolvedValue(userRow({ status: UserStatus.SUSPENDED })),
      count: jest.fn().mockResolvedValue(1),
    },
    userSession: { updateMany: jest.fn().mockResolvedValue({ count: 3 }) },
    providerProfile,
    providerDocument: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    // Servis dizi biçimli işlem kullanır; mock çağrıları olduğu gibi bekler.
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
}

function createAuditMock(): { record: jest.Mock; list: jest.Mock } {
  return { record: jest.fn().mockResolvedValue(undefined), list: jest.fn() };
}

function createService(
  prisma: PrismaMock,
  audit: { record: jest.Mock } = createAuditMock(),
): AdminService {
  const config = { fileBaseUrl: FILE_BASE_URL, defaultCurrency: 'TRY' } as AppConfigService;

  const notifications = {
    dispatch: jest.fn().mockResolvedValue(undefined),
    dispatchAll: jest.fn().mockResolvedValue(undefined),
  };

  return new AdminService(
    prisma as unknown as PrismaService,
    config,
    audit as unknown as AuditLogService,
    notifications as never,
  );
}

function query(overrides: Partial<ListAdminUsersQueryDto> = {}): ListAdminUsersQueryDto {
  return Object.assign(new ListAdminUsersQueryDto(), overrides);
}

describe('AdminService', () => {
  describe('kullanıcı listesi', () => {
    it('silinmiş kayıtları dışarıda bırakır ve sayfalama üst verisi döner', async () => {
      const prisma = createPrismaMock();

      const result = await createService(prisma).listUsers(query());

      expect(prisma.user.findMany.mock.calls[0]?.[0]).toMatchObject({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
      });
      expect(result.meta).toMatchObject({ page: 1, total: 1, hasNextPage: false });
    });

    it('arama metnini ad, e-posta ve telefonda arar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).listUsers(query({ q: 'ayşe' }));

      const where = (prisma.user.findMany.mock.calls[0]?.[0] as { where: { OR?: unknown[] } })
        .where;
      expect(where.OR).toHaveLength(3);
    });

    it('usta satırında doğrulama durumunu gösterir', async () => {
      const prisma = createPrismaMock();
      prisma.user.findMany.mockResolvedValue([
        userRow({
          role: UserRole.PROVIDER,
          providerProfile: { verificationStatus: VerificationStatus.VERIFIED },
        }),
      ]);

      const result = await createService(prisma).listUsers(query());

      expect(result.items[0]?.verificationStatus).toBe(VerificationStatus.VERIFIED);
    });
  });

  describe('hesap durumu değiştirme', () => {
    it('askıya alınca oturumları kapatır ve denetim kaydı yazar', async () => {
      const prisma = createPrismaMock();
      const audit = createAuditMock();

      await createService(prisma, audit).updateUserStatus(
        admin,
        TARGET_ID,
        { status: UserStatus.SUSPENDED },
        {},
      );

      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: TARGET_ID, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.status.updated', actorId: admin.id }),
      );
    });

    it('hesabı yeniden etkinleştirirken oturumlara dokunmaz', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(
        userRow({ status: UserStatus.SUSPENDED, role: UserRole.CUSTOMER }),
      );

      await createService(prisma).updateUserStatus(
        admin,
        TARGET_ID,
        { status: UserStatus.ACTIVE },
        {},
      );

      expect(prisma.userSession.updateMany).not.toHaveBeenCalled();
    });

    it('yöneticinin kendi hesabını kilitlemesini engeller', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(userRow({ id: admin.id, role: UserRole.ADMIN }));

      await expect(
        createService(prisma).updateUserStatus(
          admin,
          admin.id,
          { status: UserStatus.SUSPENDED },
          {},
        ),
      ).rejects.toThrow(AppException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('admin başka bir personel hesabını değiştiremez', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(userRow({ role: UserRole.ADMIN }));

      await expect(
        createService(prisma).updateUserStatus(
          admin,
          TARGET_ID,
          { status: UserStatus.SUSPENDED },
          {},
        ),
      ).rejects.toThrow(AppException);
    });

    it('süper admin personel hesabını değiştirebilir', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(userRow({ role: UserRole.SUPPORT }));

      await createService(prisma).updateUserStatus(
        superAdmin,
        TARGET_ID,
        { status: UserStatus.SUSPENDED },
        {},
      );

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('bulunmayan kullanıcıda hata verir', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        createService(prisma).updateUserStatus(admin, TARGET_ID, { status: UserStatus.BANNED }, {}),
      ).rejects.toThrow(AppException);
    });
  });

  describe('oturum kapatma', () => {
    it('kapatılan oturum sayısını döner', async () => {
      const prisma = createPrismaMock();

      const result = await createService(prisma).revokeUserSessions(admin, TARGET_ID, {});

      expect(result).toEqual({ revokedCount: 3 });
    });
  });

  describe('usta doğrulama', () => {
    it('onaylayınca bekleyen belgeleri de onaylar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateProviderVerification(
        admin,
        'provider-1',
        { verificationStatus: VerificationStatus.VERIFIED },
        {},
      );

      expect(prisma.providerDocument.updateMany.mock.calls[0]?.[0]).toMatchObject({
        where: { providerProfileId: 'provider-1', status: 'PENDING' },
        data: { status: 'APPROVED', reviewedByUserId: admin.id },
      });
    });

    it('reddedince belgelere gerekçe yazar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateProviderVerification(
        admin,
        'provider-1',
        { verificationStatus: VerificationStatus.REJECTED, reason: 'Belge okunamadı.' },
        {},
      );

      expect(prisma.providerDocument.updateMany.mock.calls[0]?.[0]).toMatchObject({
        data: { status: 'REJECTED', rejectionReason: 'Belge okunamadı.' },
      });
    });

    it('bulunmayan profilde hata verir', async () => {
      const prisma = createPrismaMock();
      prisma.providerProfile.findFirst.mockResolvedValue(null);

      await expect(
        createService(prisma).updateProviderVerification(
          admin,
          'provider-1',
          { verificationStatus: VerificationStatus.VERIFIED },
          {},
        ),
      ).rejects.toThrow(AppException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
