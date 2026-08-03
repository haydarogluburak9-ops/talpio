import { Injectable } from '@nestjs/common';
import { FilePurpose, type CurrentUser } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';
import { FilesService } from '@modules/files/files.service';

import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { toCurrentUser, userInclude } from './user.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly files: FilesService,
  ) {}

  async getMe(user: AuthenticatedUser): Promise<CurrentUser> {
    const row = await this.prisma.user.findFirst({
      where: { id: user.id, deletedAt: null },
      include: userInclude,
    });

    if (!row) throw AppException.notFound('Kullanıcı', user.id);

    return toCurrentUser(row, this.config.fileBaseUrl);
  }

  /**
   * Kullanıcının kendi profilini günceller.
   *
   * Telefon değiştiğinde doğrulama sıfırlanır: eski numaraya ait doğrulama yeni
   * numara için bir şey söylemez ve doğrulanmış görünmek SMS tabanlı akışları
   * yanıltırdı.
   */
  async updateMe(user: AuthenticatedUser, dto: UpdateUserProfileDto): Promise<CurrentUser> {
    if (dto.avatarFileId) await this.assertUsableAvatar(user.id, dto.avatarFileId);
    if (dto.phone) await this.assertPhoneAvailable(user.id, dto.phone);

    const phoneChanged = dto.phone !== undefined;

    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(phoneChanged ? { phone: dto.phone, phoneVerifiedAt: null } : {}),
        ...(dto.avatarFileId !== undefined ? { avatarFileId: dto.avatarFileId } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
      },
      include: userInclude,
    });

    return toCurrentUser(row, this.config.fileBaseUrl);
  }

  /** Görsel bu kullanıcıya ait ve avatar amaçlı yüklenmiş olmalı. */
  private async assertUsableAvatar(userId: string, fileId: string): Promise<void> {
    await this.files.assertOwnedBy(userId, [fileId]);

    const file = await this.prisma.fileAsset.findFirst({
      where: { id: fileId, deletedAt: null },
      select: { mimeType: true },
    });

    // Amaç alanı dosyada saklanmadığı için tür üzerinden kontrol edilir; belge
    // yükleyip profil görseli olarak göstermenin önüne geçer.
    if (!file || !file.mimeType.startsWith('image/')) {
      throw new AppException('UNSUPPORTED_FILE_TYPE', {
        message: 'Profil görseli bir resim olmalıdır.',
        context: { fileId, purpose: FilePurpose.AVATAR },
      });
    }
  }

  /** Telefon numarası hesap kurtarmada kullanılır; iki hesapta aynı olamaz. */
  private async assertPhoneAvailable(userId: string, phone: string): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: { phone, deletedAt: null, NOT: { id: userId } },
      select: { id: true },
    });

    if (existing) {
      throw new AppException('CONFLICT', {
        message: 'Bu telefon numarası başka bir hesapta kayıtlı.',
        context: { phone },
      });
    }
  }
}
