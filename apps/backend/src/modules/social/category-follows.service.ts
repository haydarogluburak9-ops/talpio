import { Injectable } from '@nestjs/common';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/jwt.strategy';

import { ProfilesService } from './profiles.service';

export interface CategoryFollowItem {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  createdAt: string;
  isFollowing: boolean;
}

@Injectable()
export class CategoryFollowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
  ) {}

  async follow(user: AuthenticatedUser, categoryId: string): Promise<CategoryFollowItem> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const category = await this.requireCategory(categoryId);

    await this.prisma.categoryFollow.upsert({
      where: {
        profileId_categoryId: { profileId: me.id, categoryId: category.id },
      },
      create: { profileId: me.id, categoryId: category.id },
      update: {},
    });

    return {
      categoryId: category.id,
      categorySlug: category.slug,
      categoryName: category.name,
      createdAt: new Date().toISOString(),
      isFollowing: true,
    };
  }

  async unfollow(user: AuthenticatedUser, categoryId: string): Promise<CategoryFollowItem> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const category = await this.requireCategory(categoryId);

    await this.prisma.categoryFollow.deleteMany({
      where: { profileId: me.id, categoryId: category.id },
    });

    return {
      categoryId: category.id,
      categorySlug: category.slug,
      categoryName: category.name,
      createdAt: new Date().toISOString(),
      isFollowing: false,
    };
  }

  async listMine(user: AuthenticatedUser): Promise<CategoryFollowItem[]> {
    const me = await this.profiles.ensurePersonalProfile(user.id);
    const rows = await this.prisma.categoryFollow.findMany({
      where: { profileId: me.id },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, slug: true, name: true, deletedAt: true, isActive: true } },
      },
    });

    return rows
      .filter((row) => row.category.deletedAt == null && row.category.isActive)
      .map((row) => ({
        categoryId: row.category.id,
        categorySlug: row.category.slug,
        categoryName: row.category.name,
        createdAt: row.createdAt.toISOString(),
        isFollowing: true,
      }));
  }

  async followedCategoryIds(profileId: string): Promise<string[]> {
    const rows = await this.prisma.categoryFollow.findMany({
      where: { profileId },
      select: { categoryId: true },
    });
    return rows.map((row) => row.categoryId);
  }

  /** Kayıt ve ayarlardan ilgi alanlarını toplu yazar. En az 3 kategori. */
  async replaceForUser(userId: string, categoryIds: string[]): Promise<CategoryFollowItem[]> {
    const unique = [...new Set(categoryIds)];
    const categories = await this.prisma.serviceCategory.findMany({
      where: { id: { in: unique }, deletedAt: null, isActive: true },
      select: { id: true },
    });

    if (categories.length < 3) {
      throw new AppException('VALIDATION_ERROR', {
        message: 'En az 3 ilgi alanı seçin.',
      });
    }

    const me = await this.profiles.ensurePersonalProfile(userId);

    await this.prisma.$transaction([
      this.prisma.categoryFollow.deleteMany({ where: { profileId: me.id } }),
      this.prisma.categoryFollow.createMany({
        data: categories.map((category) => ({
          profileId: me.id,
          categoryId: category.id,
        })),
        skipDuplicates: true,
      }),
    ]);

    return this.listMine({ id: userId } as AuthenticatedUser);
  }

  private async requireCategory(categoryId: string) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: categoryId, deletedAt: null, isActive: true },
      select: { id: true, slug: true, name: true },
    });
    if (!category) {
      throw new AppException('NOT_FOUND', { message: 'Kategori bulunamadı.' });
    }
    return category;
  }
}
