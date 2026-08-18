import { UserRole, UserStatus } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { AppConfigService } from '@config/app-config.service';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import type { FilesService } from '@modules/files/files.service';

import { UsersService } from './users.service';

const USER_ID = 'user-1';
const FILE_ID = '0194a1b2-c3d4-7000-8000-000000000001';
const FILE_BASE_URL = 'http://localhost:9000/talpio';

const customer: AuthenticatedUser = { id: USER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    email: 'musteri@talpio.com',
    phone: '+905321234567',
    fullName: 'Ayşe Yılmaz',
    role: UserRole.CUSTOMER,
    status: UserStatus.ACTIVE,
    locale: 'tr',
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    phoneVerifiedAt: new Date('2026-01-02T00:00:00.000Z'),
    lastActiveAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-02-01T00:00:00.000Z'),
    customerProfile: { id: 'customer-1' },
    providerProfile: null,
    avatar: null,
    ...overrides,
  };
}

type PrismaMock = {
  user: { findFirst: jest.Mock; update: jest.Mock };
  fileAsset: { findFirst: jest.Mock };
  userSession: { updateMany: jest.Mock };
  deviceToken: { updateMany: jest.Mock };
  $transaction: jest.Mock;
};

type FilesMock = { assertOwnedBy: jest.Mock };

/**
 * `user.findFirst` iki ayrı amaçla çağrılır: profili okumak ve telefonun boşta
 * olduğunu doğrulamak. Sorgudaki `phone` alanı ikisini ayırır.
 */
function createPrismaMock(): PrismaMock {
  return {
    user: {
      findFirst: jest.fn((args: { where: { phone?: string } }) =>
        Promise.resolve(args.where.phone ? null : userRow()),
      ),
      update: jest.fn().mockResolvedValue(userRow()),
    },
    fileAsset: { findFirst: jest.fn().mockResolvedValue({ mimeType: 'image/jpeg' }) },
    userSession: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    deviceToken: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

function createFilesMock(): FilesMock {
  return { assertOwnedBy: jest.fn().mockResolvedValue(undefined) };
}

function createService(prisma: PrismaMock, files: FilesMock = createFilesMock()): UsersService {
  const config = { fileBaseUrl: FILE_BASE_URL } as unknown as AppConfigService;

  return new UsersService(
    prisma as unknown as PrismaService,
    config,
    files as unknown as FilesService,
  );
}

function updateArgs(prisma: PrismaMock): { data: Record<string, unknown> } {
  return prisma.user.update.mock.calls[0]?.[0] as { data: Record<string, unknown> };
}

describe('UsersService', () => {
  describe('profil okuma', () => {
    it('profil görselinin adresini üretir', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(
        userRow({ avatar: { storageKey: 'avatars/abc.jpg' } }),
      );

      const result = await createService(prisma).getMe(customer);

      expect(result.avatarUrl).toBe(`${FILE_BASE_URL}/avatars/abc.jpg`);
    });

    it('görseli olmayan kullanıcıda adres boştur', async () => {
      const result = await createService(createPrismaMock()).getMe(customer);

      expect(result.avatarUrl).toBeNull();
    });

    it('silinmiş kullanıcıyı bulamaz', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(createService(prisma).getMe(customer)).rejects.toThrow(AppException);
    });
  });

  describe('profil güncelleme', () => {
    it('yalnızca gönderilen alanları yazar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateMe(customer, { fullName: 'Ayşe Demir' });

      expect(updateArgs(prisma).data).toEqual({ fullName: 'Ayşe Demir' });
    });

    it('telefon değişince doğrulamayı sıfırlar', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateMe(customer, { phone: '+905339876543' });

      expect(updateArgs(prisma).data).toEqual({
        phone: '+905339876543',
        phoneVerifiedAt: null,
      });
    });

    it('telefon kaldırılınca da doğrulama sıfırlanır', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).updateMe(customer, { phone: null });

      expect(updateArgs(prisma).data).toEqual({ phone: null, phoneVerifiedAt: null });
    });

    it('başka hesapta kayıtlı telefonu kabul etmez', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockImplementation((args: { where: { phone?: string } }) =>
        Promise.resolve(args.where.phone ? { id: 'user-2' } : userRow()),
      );

      await expect(
        createService(prisma).updateMe(customer, { phone: '+905339876543' }),
      ).rejects.toThrow(AppException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('görsel kimliğini doğrulayıp yazar', async () => {
      const prisma = createPrismaMock();
      const files = createFilesMock();

      await createService(prisma, files).updateMe(customer, { avatarFileId: FILE_ID });

      expect(files.assertOwnedBy).toHaveBeenCalledWith(USER_ID, [FILE_ID]);
      expect(updateArgs(prisma).data).toEqual({ avatarFileId: FILE_ID });
    });

    it('resim olmayan dosyayı profil görseli yapmaz', async () => {
      const prisma = createPrismaMock();
      prisma.fileAsset.findFirst.mockResolvedValue({ mimeType: 'application/pdf' });

      await expect(
        createService(prisma).updateMe(customer, { avatarFileId: FILE_ID }),
      ).rejects.toThrow(AppException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('başkasının dosyasını profil görseli yapmaz', async () => {
      const prisma = createPrismaMock();
      const files = createFilesMock();
      files.assertOwnedBy.mockRejectedValue(AppException.forbiddenResource('Dosya', {}));

      await expect(
        createService(prisma, files).updateMe(customer, { avatarFileId: FILE_ID }),
      ).rejects.toThrow(AppException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('görsel kaldırma isteğini dosya kontrolüne sokmaz', async () => {
      const prisma = createPrismaMock();
      const files = createFilesMock();

      await createService(prisma, files).updateMe(customer, { avatarFileId: null });

      expect(files.assertOwnedBy).not.toHaveBeenCalled();
      expect(updateArgs(prisma).data).toEqual({ avatarFileId: null });
    });
  });

  describe('hesap kapatma', () => {
    it('e-postayı anonimleştirir ve oturumları iptal eder', async () => {
      const prisma = createPrismaMock();

      await createService(prisma).deleteMe(customer);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: UserStatus.DEACTIVATED,
            email: `deleted.${USER_ID}@deleted.invalid`,
            phone: null,
          }),
        }),
      );
      expect(prisma.userSession.updateMany).toHaveBeenCalled();
      expect(prisma.deviceToken.updateMany).toHaveBeenCalled();
    });

    it('zaten silinmiş hesabı kapatmaz', async () => {
      const prisma = createPrismaMock();
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(createService(prisma).deleteMe(customer)).rejects.toThrow(AppException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
