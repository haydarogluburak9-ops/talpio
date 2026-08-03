import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

/**
 * Değerlendirme listesi süzgeçleri.
 *
 * Taraf ayrımı yapılmaz: müşteri yazdıklarını, usta aldıklarını görür. Hangi
 * tarafın sorgulandığı oturumdaki role göre belirlenir.
 */
export class ListReviewsQueryDto extends PaginationQueryDto {
  /** Bir siparişin değerlendirmesini bulmak için; sipariş ekranından tek çağrıyla erişilir. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

/** Herkese açık usta yorumları için sayfalama dışında süzgeç yoktur. */
export class ListProviderReviewsQueryDto extends PaginationQueryDto {}
