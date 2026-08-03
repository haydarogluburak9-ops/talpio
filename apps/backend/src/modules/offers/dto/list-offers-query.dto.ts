import { ApiPropertyOptional } from '@nestjs/swagger';
import { OfferStatus } from '@ustapilot/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const toStatusArray = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') return value.split(',').filter(Boolean);
  return value;
};

/** Ustanın kendi tekliflerini süzmesi için parametreler. */
export class ListMyOffersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OfferStatus, isArray: true })
  @IsOptional()
  @Transform(toStatusArray)
  @IsEnum(OfferStatus, { each: true })
  status?: OfferStatus[];
}

/** Müşterinin bir talebe gelen teklifleri süzmesi için parametreler. */
export class ListJobOffersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OfferStatus, isArray: true })
  @IsOptional()
  @Transform(toStatusArray)
  @IsEnum(OfferStatus, { each: true })
  status?: OfferStatus[];
}
