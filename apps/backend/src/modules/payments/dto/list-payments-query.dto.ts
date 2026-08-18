import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, TransactionType } from '@talpio/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

/**
 * Ödeme listesi süzgeçleri.
 *
 * Taraf ayrımı yapılmaz: hangi ödemelerin görüneceği oturumdaki role göre
 * belirlenir, süzgeçler yalnızca o küme içinde daraltır.
 */
export class ListPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(PaymentStatus, { each: true })
  status?: PaymentStatus[];

  /** Sipariş ekranının makbuzu tek çağrıyla alması için. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

export class ListTransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TransactionType, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(TransactionType, { each: true })
  type?: TransactionType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
