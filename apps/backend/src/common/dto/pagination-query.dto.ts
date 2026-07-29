import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;

/**
 * Tüm liste uçlarında ortak sayfalama, arama ve sıralama parametreleri.
 * Sıralama biçimi: `alan:yön` (örn. `createdAt:desc`).
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Serbest metin araması' })
  @IsOptional()
  @IsString()
  @Transform(({ value }): string | undefined =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  q?: string;

  @ApiPropertyOptional({ example: 'createdAt:desc' })
  @IsOptional()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_.]*:(asc|desc)$/, {
    message: 'sort parametresi `alan:asc` veya `alan:desc` biçiminde olmalıdır',
  })
  sort?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * `sort` parametresini Prisma orderBy nesnesine çevirir.
   * Yalnızca izin verilen alanlar kabul edilir; aksi halde varsayılana düşer.
   */
  toOrderBy<T extends string>(
    allowedFields: readonly T[],
    fallback: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' },
  ): Record<string, 'asc' | 'desc'> {
    if (!this.sort) return fallback;

    const [field, direction] = this.sort.split(':');
    if (!field || !allowedFields.includes(field as T)) return fallback;

    return { [field]: direction === 'asc' ? 'asc' : 'desc' };
  }
}

export class CursorQueryDto {
  @ApiPropertyOptional({ description: 'Önceki sayfanın son kaydının kimliği' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 30, minimum: 1, maximum: MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit: number = 30;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction: 'asc' | 'desc' = 'desc';
}
