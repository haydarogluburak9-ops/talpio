import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({ default: false, description: 'Alt kategoriler de dönsün mü?' })
  @IsOptional()
  @Transform(({ value }): boolean => value === true || value === 'true')
  @IsBoolean()
  withSubcategories = false;
}
