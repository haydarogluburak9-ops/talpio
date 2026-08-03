import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JOB, UPLOAD } from '@ustapilot/config';
import { JobSize, JobTimeSlot } from '@ustapilot/types';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class JobLocationDto {
  @ApiProperty()
  @IsLatitude()
  latitude!: number;

  @ApiProperty()
  @IsLongitude()
  longitude!: number;
}

export class JobAddressDto {
  @ApiProperty()
  @IsUUID()
  cityId!: string;

  @ApiProperty()
  @IsUUID()
  districtId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  neighborhoodId?: string;

  @ApiPropertyOptional({ description: 'Açık adres. Yalnızca usta seçildikten sonra paylaşılır.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(5, 500)
  addressLine?: string;

  @ApiPropertyOptional({ type: JobLocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => JobLocationDto)
  location?: JobLocationDto;
}

/**
 * Talep oluşturma gövdesi.
 *
 * Kurallar `@ustapilot/validation` içindeki `createJobRequestSchema` ile aynıdır;
 * istemciler formu o Zod şemasıyla doğrular, backend aynı sınırları burada
 * yeniden uygular çünkü istemci doğrulaması güvenlik sınırı sayılmaz.
 */
export class CreateJobDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subcategoryId?: string;

  @ApiProperty({ minLength: JOB.minTitleLength, maxLength: JOB.maxTitleLength })
  @Transform(trim)
  @IsString()
  @Length(JOB.minTitleLength, JOB.maxTitleLength)
  title!: string;

  @ApiProperty({ minLength: JOB.minDescriptionLength, maxLength: JOB.maxDescriptionLength })
  @Transform(trim)
  @IsString()
  @Length(JOB.minDescriptionLength, JOB.maxDescriptionLength)
  description!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isUrgent = false;

  @ApiPropertyOptional({ enum: JobSize, default: JobSize.UNKNOWN })
  @IsOptional()
  @IsEnum(JobSize)
  size: JobSize = JobSize.UNKNOWN;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  materialsIncluded?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  inspectionRequired = false;

  @ApiPropertyOptional({ description: 'Kuruş cinsinden yaklaşık bütçe.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  budgetMinor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  problemStartedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  preferredDate?: string;

  @ApiPropertyOptional({ enum: JobTimeSlot, default: JobTimeSlot.FLEXIBLE })
  @IsOptional()
  @IsEnum(JobTimeSlot)
  preferredTimeSlot: JobTimeSlot = JobTimeSlot.FLEXIBLE;

  @ApiProperty({ type: JobAddressDto })
  @ValidateNested()
  @Type(() => JobAddressDto)
  address!: JobAddressDto;

  @ApiPropertyOptional({ type: [String], maxItems: UPLOAD.maxJobAttachments })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  attachmentFileIds: string[] = [];

  @ApiPropertyOptional({
    default: true,
    description: 'Yanlış olduğunda talep taslak kalır ve ustalara gösterilmez.',
  })
  @IsOptional()
  @IsBoolean()
  publish = true;
}

export class CancelJobDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;
}
