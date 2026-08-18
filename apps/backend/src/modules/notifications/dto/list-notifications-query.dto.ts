import { ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@talpio/types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' || value === true ? true : value === 'false' || value === false ? false : value;

export class ListNotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Yalnızca okunmamış bildirimler' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional({ enum: NotificationType, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(NotificationType, { each: true })
  type?: NotificationType[];
}
