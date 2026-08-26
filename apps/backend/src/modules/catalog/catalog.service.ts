import { Injectable } from '@nestjs/common';
import type {
  AttributeFieldDefinition,
  AttributeFieldType,
  CategoryAttributeSchema,
  ServiceCategory,
  ServiceSubcategory,
} from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { PrismaService } from '@infra/prisma/prisma.service';

const ATTRIBUTE_FIELD_TYPES: readonly AttributeFieldType[] = [
  'string',
  'number',
  'boolean',
  'enum',
  'date',
  'decimal',
];

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

  /**
   * Kategoriye özel talep alanlarını döndürür.
   *
   * Kategorilerin büyük çoğunluğunda şema yoktur; bu durumda boş alan listesi
   * döner. Yalnızca kategori hiç bulunamadığında hata verilir.
   */
  async getCategoryAttributeSchema(idOrSlug: string): Promise<CategoryAttributeSchema> {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { deletedAt: null, OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });

    if (!category) throw AppException.notFound('Kategori', idOrSlug);

    // Aynı kategoride birden fazla sürüm yayında kalabilir; en güncel olan kazanır.
    const record = await this.prisma.attributeSchema.findFirst({
      where: { categoryId: category.id, isActive: true },
      orderBy: { version: 'desc' },
      select: { version: true, schema: true },
    });

    if (!record) return { categoryId: category.id, version: null, fields: [] };

    const fields = this.parseAttributeFields(record.schema);
    return {
      categoryId: category.id,
      version: fields.length > 0 ? record.version : null,
      fields,
    };
  }

  /**
   * `schema` sütunu şemasız JSON'dur; admin veya seed hatalı yazdığında form
   * çökmesin diye alanlar tek tek doğrulanır ve tanınmayanlar elenir.
   */
  private parseAttributeFields(schema: unknown): AttributeFieldDefinition[] {
    if (typeof schema !== 'object' || schema === null) return [];
    const raw = (schema as { fields?: unknown }).fields;
    if (!Array.isArray(raw)) return [];

    const fields: AttributeFieldDefinition[] = [];

    for (const entry of raw) {
      if (typeof entry !== 'object' || entry === null) continue;
      const candidate = entry as Record<string, unknown>;
      const { key, label, type } = candidate;

      if (typeof key !== 'string' || key.length === 0) continue;
      if (typeof label !== 'string' || label.length === 0) continue;
      if (typeof type !== 'string' || !ATTRIBUTE_FIELD_TYPES.includes(type as AttributeFieldType)) {
        continue;
      }

      const options = Array.isArray(candidate.options)
        ? candidate.options.filter((option): option is string => typeof option === 'string')
        : undefined;

      fields.push({
        key,
        label,
        type: type as AttributeFieldType,
        ...(candidate.required === true ? { required: true } : {}),
        ...(options && options.length > 0 ? { options } : {}),
        ...(typeof candidate.unit === 'string' ? { unit: candidate.unit } : {}),
        ...(typeof candidate.description === 'string'
          ? { description: candidate.description }
          : {}),
      });
    }

    return fields;
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
