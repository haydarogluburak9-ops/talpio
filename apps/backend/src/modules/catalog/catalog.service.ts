import { Injectable } from '@nestjs/common';
import type { ServiceCategory, ServiceSubcategory } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subcategories?: SubcategoryRow[];
};

type SubcategoryRow = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Yayındaki kategorileri döndürür. Kategoriler koda gömülmez; bu uç web,
   * mobil ve admin için tek kaynaktır.
   */
  async listCategories(options: {
    includeInactive?: boolean;
    withSubcategories?: boolean;
  }): Promise<ServiceCategory[]> {
    const where = {
      deletedAt: null,
      ...(options.includeInactive === true ? {} : { isActive: true }),
    };

    const categories = await this.prisma.serviceCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      ...(options.withSubcategories === true
        ? {
            include: {
              subcategories: {
                where: {
                  deletedAt: null,
                  ...(options.includeInactive === true ? {} : { isActive: true }),
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              },
            },
          }
        : {}),
    });

    return categories.map((category) => this.toCategory(category as CategoryRow));
  }

  async getCategoryBySlug(slug: string): Promise<ServiceCategory> {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { slug, deletedAt: null },
      include: {
        subcategories: {
          where: { deletedAt: null, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });

    if (!category) throw AppException.notFound('Kategori', slug);

    return this.toCategory(category);
  }

  private toCategory(row: CategoryRow): ServiceCategory {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      iconKey: row.iconKey,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ...(row.subcategories
        ? { subcategories: row.subcategories.map((item) => this.toSubcategory(item)) }
        : {}),
    };
  }

  private toSubcategory(row: SubcategoryRow): ServiceSubcategory {
    return {
      id: row.id,
      categoryId: row.categoryId,
      slug: row.slug,
      name: row.name,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
