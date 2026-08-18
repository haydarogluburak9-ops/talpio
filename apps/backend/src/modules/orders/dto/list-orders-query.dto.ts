import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@talpio/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const toStatusArray = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') return value.split(',').filter(Boolean);
  return value;
};

/**
 * Sipariş listesi süzgeçleri.
 *
 * Taraf ayrımı yapılmaz: müşteri kendi siparişlerini, satıcı üstlendiği işleri
 * görür. Hangi tarafın sorgulandığı oturumdaki role göre belirlenir.
 */
export class ListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus, isArray: true })
  @IsOptional()
  @Transform(toStatusArray)
  @IsEnum(OrderStatus, { each: true })
  status?: OrderStatus[];

  /** Bir talebin siparişini bulmak için; talep ekranından tek çağrıyla erişilir. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobRequestId?: string;
}
