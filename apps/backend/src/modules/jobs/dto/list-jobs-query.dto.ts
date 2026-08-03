import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobRequestStatus } from '@ustapilot/types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === '') return undefined;
  return value === true || value === 'true';
};

/** Müşterinin kendi taleplerini süzmesi için parametreler. */
export class ListJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: JobRequestStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }): unknown => {
    if (typeof value === 'string') return value.split(',').filter(Boolean);
    return value;
  })
  @IsEnum(JobRequestStatus, { each: true })
  status?: JobRequestStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

/** Ustaya açık iş havuzu için parametreler. */
export class AvailableJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Yalnızca acil talepler' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isUrgent?: boolean;

  @ApiPropertyOptional({
    default: true,
    description:
      'Ustanın hizmet verdiği kategori ve bölgelerle sınırla. Kapatılırsa tüm açık talepler döner.',
  })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  matchMyServices = true;
}
