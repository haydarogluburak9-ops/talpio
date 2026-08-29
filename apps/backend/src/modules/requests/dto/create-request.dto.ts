import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RequestSource, RequestType, RequestVisibility } from '@talpio/types';

export class CreateCommerceRequestDto {
  @ApiProperty({ enum: RequestType })
  @IsEnum(RequestType)
  requestType!: (typeof RequestType)[keyof typeof RequestType];

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quantity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  budgetMinor?: number;

  // Belirtilmezse alıcının para birimine düşülür; istemciyi her talepte kod
  // göndermeye zorlamak eski istemcileri kırardı.
  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deliveryCityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deliveryDistrictId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddressText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  deliveryDeadline?: string;

  @ApiPropertyOptional({
    description: 'Doğrudan teklif istenen işletme; verilirse talep yalnızca ona gider',
  })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional({ enum: RequestVisibility })
  @IsOptional()
  @IsEnum(RequestVisibility)
  visibility?: (typeof RequestVisibility)[keyof typeof RequestVisibility];

  @ApiPropertyOptional({ enum: RequestSource })
  @IsOptional()
  @IsEnum(RequestSource)
  source?: (typeof RequestSource)[keyof typeof RequestSource];

  @ApiPropertyOptional({ description: 'true ise oluştururken yayınlar' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}

export class CreateRequestOfferDto {
  @ApiProperty()
  @IsUUID()
  businessId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  amountMinor!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  deliveryDays?: number;

  @ApiProperty({ description: 'Kargo ücreti fiyata dahil mi' })
  @IsBoolean()
  shippingIncluded!: boolean;

  @ApiProperty({ description: 'Satıcı / sevkiyat lokasyonu' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  locationText!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiProperty()
  @IsDateString()
  validUntil!: string;
}

export class ListRequestsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class NearbyRequestsQueryDto {
  @ApiPropertyOptional({ description: 'Kenar çubuğu kutusu için küçük tutulur' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
