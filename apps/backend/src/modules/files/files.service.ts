import { Injectable } from '@nestjs/common';
import { UPLOAD } from '@ustapilot/config';
import { FilePurpose, UserRole, type FileAsset } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import { StorageService } from '@infra/storage/storage.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

/** Yükleme türüne göre depo klasörü, boyut sınırı ve görünürlük. */
interface PurposeRule {
  folder: string;
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
  /** Belgeler dışındaki içerik doğrudan bağlantıyla gösterilir. */
  isPublic: boolean;
}

const RULES: Record<FilePurpose, PurposeRule> = {
  [FilePurpose.JOB_PHOTO]: {
    folder: 'jobs',
    maxSizeBytes: UPLOAD.maxImageSizeBytes,
    allowedMimeTypes: UPLOAD.allowedImageMimeTypes,
    isPublic: true,
  },
  [FilePurpose.MESSAGE_ATTACHMENT]: {
    folder: 'messages',
    maxSizeBytes: UPLOAD.maxImageSizeBytes,
    allowedMimeTypes: UPLOAD.allowedImageMimeTypes,
    isPublic: true,
  },
  [FilePurpose.AVATAR]: {
    folder: 'avatars',
    maxSizeBytes: UPLOAD.maxImageSizeBytes,
    allowedMimeTypes: UPLOAD.allowedImageMimeTypes,
    isPublic: true,
  },
  [FilePurpose.REVIEW_PHOTO]: {
    folder: 'reviews',
    maxSizeBytes: UPLOAD.maxImageSizeBytes,
    allowedMimeTypes: UPLOAD.allowedImageMimeTypes,
    isPublic: true,
  },
  [FilePurpose.PROVIDER_DOCUMENT]: {
    folder: 'documents',
    maxSizeBytes: UPLOAD.maxDocumentSizeBytes,
    allowedMimeTypes: UPLOAD.allowedDocumentMimeTypes,
    // Kimlik ve ustalık belgeleri yalnızca sahibi ve yönetim tarafından görülür.
    isPublic: false,
  },
};

export interface UploadInput {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  originalName?: string;
}

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Dosyayı depoya yazar ve üst verisini kaydeder.
   *
   * Kayıt henüz hiçbir varlığa bağlı değildir; talep veya mesaj oluşturulurken
   * kimliğiyle ilişkilendirilir. Bağlanmayan kayıtlar yalnızca yer kaplar.
   */
  async upload(
    user: AuthenticatedUser,
    purpose: FilePurpose,
    input: UploadInput,
  ): Promise<FileAsset> {
    const rule = RULES[purpose];

    if (input.sizeBytes > rule.maxSizeBytes) {
      throw new AppException('FILE_TOO_LARGE', {
        message: `Dosya en fazla ${Math.round(rule.maxSizeBytes / (1024 * 1024))} MB olabilir.`,
        context: { sizeBytes: input.sizeBytes, maxSizeBytes: rule.maxSizeBytes },
      });
    }

    if (!rule.allowedMimeTypes.includes(input.mimeType)) {
      throw new AppException('UNSUPPORTED_FILE_TYPE', {
        message: 'Bu dosya türü kabul edilmiyor.',
        context: { mimeType: input.mimeType, allowed: rule.allowedMimeTypes },
      });
    }

    const stored = await this.storage.upload({
      folder: rule.folder,
      body: input.buffer,
      mimeType: input.mimeType,
      ...(input.originalName ? { originalName: input.originalName } : {}),
      isPublic: rule.isPublic,
    });

    const row = await this.prisma.fileAsset.create({
      data: {
        ownerUserId: user.id,
        storageKey: stored.storageKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        originalName: input.originalName ?? null,
        isPublic: rule.isPublic,
      },
    });

    return {
      id: row.id,
      url: stored.url ?? (await this.storage.signedUrl(row.storageKey)),
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      originalName: row.originalName,
      isPublic: row.isPublic,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * Dosyanın erişilebilir adresini döner.
   *
   * Gizli dosyalarda adres süreli imzalıdır; bu yüzden her istekte yeniden
   * üretilir ve önbelleğe alınmaz.
   */
  async getById(user: AuthenticatedUser, id: string): Promise<FileAsset> {
    const row = await this.prisma.fileAsset.findFirst({ where: { id, deletedAt: null } });
    if (!row) throw AppException.notFound('Dosya', id);

    if (!row.isPublic && row.ownerUserId !== user.id && !this.isStaff(user.role)) {
      throw AppException.forbiddenResource('Dosya', { fileId: id });
    }

    return {
      id: row.id,
      url: row.isPublic
        ? this.storage.publicUrl(row.storageKey)
        : await this.storage.signedUrl(row.storageKey),
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      originalName: row.originalName,
      isPublic: row.isPublic,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * Dosyayı siler.
   *
   * Yalnızca yükleyen kişi silebilir ve yalnızca henüz hiçbir kayda bağlanmamış
   * dosyalar silinir: yayınlanmış bir talebin fotoğrafını sonradan kaldırmak
   * teklif veren ustaların gördüğü işi değiştirirdi.
   */
  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const row = await this.prisma.fileAsset.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { jobAttachments: true, messageAttachments: true, providerDocuments: true },
        },
      },
    });

    if (!row) throw AppException.notFound('Dosya', id);

    if (row.ownerUserId !== user.id) {
      throw AppException.forbiddenResource('Dosya', { fileId: id });
    }

    const attachedCount =
      row._count.jobAttachments + row._count.messageAttachments + row._count.providerDocuments;

    if (attachedCount > 0) {
      throw new AppException('CONFLICT', {
        message: 'Bir kayda bağlı dosya silinemez.',
        context: { fileId: id },
      });
    }

    await this.prisma.fileAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.storage.remove(row.storageKey);
  }

  /**
   * Verilen dosyaların yükleyicisi bu kullanıcı mı?
   *
   * Talep ve mesaj oluşturulurken başkasının dosyasının iliştirilmesini önler;
   * aksi halde kimlik tahmin eden biri yabancı bir belgeyi kendi kaydına
   * bağlayabilirdi.
   */
  async assertOwnedBy(userId: string, fileIds: string[]): Promise<void> {
    if (fileIds.length === 0) return;

    const owned = await this.prisma.fileAsset.count({
      where: { id: { in: fileIds }, ownerUserId: userId, deletedAt: null },
    });

    if (owned !== fileIds.length) {
      throw AppException.forbiddenResource('Dosya', { fileIds });
    }
  }

  private isStaff(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPPORT;
  }
}
