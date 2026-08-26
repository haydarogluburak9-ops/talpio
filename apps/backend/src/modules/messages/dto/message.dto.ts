import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MESSAGE } from '@talpio/config';
import { MessageType } from '@talpio/types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class GeoPointDto {
  @ApiProperty()
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;
}

/**
 * Mesaj gövdesi.
 *
 * Kurallar `@talpio/validation` içindeki `sendMessageSchema` ile aynıdır;
 * istemci formu o şemayla doğrular, backend aynı sınırları burada yeniden
 * uygular çünkü istemci doğrulaması güvenlik sınırı sayılmaz.
 */
export class SendMessageDto {
  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;

  @ApiPropertyOptional({ maxLength: MESSAGE.maxBodyLength })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(MESSAGE.maxBodyLength)
  body?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MESSAGE.maxAttachments)
  @IsUUID('all', { each: true })
  attachmentFileIds: string[] = [];

  @ApiPropertyOptional({ type: GeoPointDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;

  @ApiProperty({
    description: 'Aynı mesajın çift gönderilmesini önleyen istemci anahtarı.',
    minLength: 8,
    maxLength: 64,
  })
  @Transform(trim)
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  clientMessageId!: string;
}

/** Sohbet açma gövdesi. Sohbet bir siparişin tarafları arasında kurulur. */
export class OpenConversationDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;
}

export class ListConversationsQueryDto extends PaginationQueryDto {}

export class ListMessagesQueryDto extends PaginationQueryDto {}
