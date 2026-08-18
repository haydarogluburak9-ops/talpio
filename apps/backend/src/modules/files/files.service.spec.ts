import { FilePurpose, UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import type { PrismaService } from '@infra/prisma/prisma.service';
import type { StorageService } from '@infra/storage/storage.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { FilesService } from './files.service';

const OWNER_ID = 'user-1';
const FILE_ID = '0194a1b2-c3d4-7000-8000-000000000001';

const owner: AuthenticatedUser = { id: OWNER_ID, role: UserRole.CUSTOMER, sessionId: 's1' };
const stranger: AuthenticatedUser = { id: 'user-2', role: UserRole.CUSTOMER, sessionId: 's2' };
const admin: AuthenticatedUser = { id: 'admin-1', role: UserRole.ADMIN, sessionId: 's3' };

function fileRow(overrides: Record<string, unknown> = {}) {
  return {
    id: FILE_ID,
    ownerUserId: OWNER_ID,
    storageKey: 'jobs/abc.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    originalName: 'mutfak.jpg',
    checksum: null,
    isPublic: true,
    createdAt: new Date('2026-02-01T10:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  };
}

type PrismaMock = {
  fileAsset: { create: jest.Mock; findFirst: jest.Mock; count: jest.Mock };
};

type StorageMock = {
  upload: jest.Mock;
  signedUrl: jest.Mock;
  publicUrl: jest.Mock;
};

function createMocks(): { prisma: PrismaMock; storage: StorageMock } {
  return {
    prisma: {
      fileAsset: {
        create: jest.fn().mockResolvedValue(fileRow()),
        findFirst: jest.fn().mockResolvedValue(fileRow()),
        count: jest.fn().mockResolvedValue(0),
      },
    },
    storage: {
      upload: jest
        .fn()
        .mockResolvedValue({ storageKey: 'jobs/abc.jpg', url: 'http://cdn/jobs/abc.jpg' }),
      signedUrl: jest.fn().mockResolvedValue('http://cdn/signed'),
      publicUrl: jest.fn().mockReturnValue('http://cdn/jobs/abc.jpg'),
    },
  };
}

function createService(prisma: PrismaMock, storage: StorageMock): FilesService {
  return new FilesService(
    prisma as unknown as PrismaService,
    storage as unknown as StorageService,
    { enqueue: jest.fn() } as never,
  );
}

function imageInput(overrides: Record<string, unknown> = {}) {
  return {
    buffer: Buffer.from('fake'),
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    originalName: 'mutfak.jpg',
    ...overrides,
  };
}

/** Mock çağrı argümanı `any` olduğundan okumadan önce beklenen şekle daraltılır. */
function firstCallArg<T>(mock: jest.Mock): T {
  return mock.mock.calls[0]?.[0] as T;
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

describe('FilesService', () => {
  let prisma: PrismaMock;
  let storage: StorageMock;
  let service: FilesService;

  beforeEach(() => {
    ({ prisma, storage } = createMocks());
    service = createService(prisma, storage);
  });

  describe('yükleme', () => {
    it('talep fotoğrafını herkese açık olarak yükler', async () => {
      const asset = await service.upload(owner, FilePurpose.JOB_PHOTO, imageInput());

      expect(asset.url).toBe('http://cdn/jobs/abc.jpg');
      const args = firstCallArg<{ folder: string; isPublic: boolean }>(storage.upload);
      expect(args).toMatchObject({ folder: 'jobs', isPublic: true });
    });

    it('satıcı belgesini gizli tutar ve imzalı adres üretir', async () => {
      storage.upload.mockResolvedValue({ storageKey: 'documents/x.pdf', url: null });
      prisma.fileAsset.create.mockResolvedValue(
        fileRow({ isPublic: false, storageKey: 'documents/x.pdf', mimeType: 'application/pdf' }),
      );

      const asset = await service.upload(
        owner,
        FilePurpose.PROVIDER_DOCUMENT,
        imageInput({ mimeType: 'application/pdf', originalName: 'belge.pdf' }),
      );

      expect(asset.url).toBe('http://cdn/signed');
      const args = firstCallArg<{ isPublic: boolean }>(storage.upload);
      expect(args.isPublic).toBe(false);
    });

    it('boyut sınırını aşan dosyayı reddeder', async () => {
      await expect(
        codeOfRejection(() =>
          service.upload(owner, FilePurpose.JOB_PHOTO, imageInput({ sizeBytes: 50 * 1024 * 1024 })),
        ),
      ).resolves.toBe('FILE_TOO_LARGE');

      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('desteklenmeyen türü reddeder', async () => {
      await expect(
        codeOfRejection(() =>
          service.upload(
            owner,
            FilePurpose.JOB_PHOTO,
            imageInput({ mimeType: 'application/x-msdownload' }),
          ),
        ),
      ).resolves.toBe('UNSUPPORTED_FILE_TYPE');
    });

    it('belge amacında PDF kabul eder ama fotoğraf amacında etmez', async () => {
      await expect(
        codeOfRejection(() =>
          service.upload(owner, FilePurpose.JOB_PHOTO, imageInput({ mimeType: 'application/pdf' })),
        ),
      ).resolves.toBe('UNSUPPORTED_FILE_TYPE');
    });

    it('yükleyeni dosyanın sahibi olarak kaydeder', async () => {
      await service.upload(owner, FilePurpose.AVATAR, imageInput());

      const { data } = firstCallArg<{ data: { ownerUserId: string } }>(prisma.fileAsset.create);
      expect(data.ownerUserId).toBe(OWNER_ID);
    });
  });

  describe('erişim', () => {
    it('herkese açık dosyayı yabancıya da verir', async () => {
      const asset = await service.getById(stranger, FILE_ID);

      expect(asset.url).toBe('http://cdn/jobs/abc.jpg');
    });

    it('gizli dosyayı yabancıya vermez', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(fileRow({ isPublic: false }));

      await expect(codeOfRejection(() => service.getById(stranger, FILE_ID))).resolves.toBe(
        'FORBIDDEN_RESOURCE',
      );
    });

    it('gizli dosyayı sahibine imzalı adresle verir', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(fileRow({ isPublic: false }));

      const asset = await service.getById(owner, FILE_ID);

      expect(asset.url).toBe('http://cdn/signed');
    });

    it('gizli dosyayı yönetime açar', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(fileRow({ isPublic: false }));

      const asset = await service.getById(admin, FILE_ID);

      expect(asset.url).toBe('http://cdn/signed');
    });

    it('bulunamayan dosyada 404 üretir', async () => {
      prisma.fileAsset.findFirst.mockResolvedValue(null);

      await expect(codeOfRejection(() => service.getById(owner, FILE_ID))).resolves.toBe(
        'NOT_FOUND',
      );
    });
  });

  describe('sahiplik doğrulaması', () => {
    it('boş listede sorgu atmaz', async () => {
      await service.assertOwnedBy(OWNER_ID, []);

      expect(prisma.fileAsset.count).not.toHaveBeenCalled();
    });

    it('tüm dosyalar kullanıcıya aitse geçer', async () => {
      prisma.fileAsset.count.mockResolvedValue(2);

      await expect(service.assertOwnedBy(OWNER_ID, ['a', 'b'])).resolves.toBeUndefined();
    });

    it('yabancı dosya karışmışsa reddeder', async () => {
      prisma.fileAsset.count.mockResolvedValue(1);

      await expect(
        codeOfRejection(() => service.assertOwnedBy(OWNER_ID, ['a', 'b'])),
      ).resolves.toBe('FORBIDDEN_RESOURCE');
    });
  });
});
