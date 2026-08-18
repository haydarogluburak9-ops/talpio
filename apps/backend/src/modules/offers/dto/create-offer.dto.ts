import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OFFER } from '@talpio/config';
import { OfferPriceType } from '@talpio/types';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Tahmini süre için üst sınır: 30 gün. Daha uzunu teklif değil, proje sayılır. */
const MAX_DURATION_MINUTES = 60 * 24 * 30;
const MIN_DURATION_MINUTES = 15;

/**
 * Teklif oluşturma gövdesi.
 *
 * Kurallar `@talpio/validation` içindeki `createOfferSchema` ile aynıdır;
 * istemciler formu o Zod şemasıyla doğrular, backend aynı sınırları burada
 * yeniden uygular çünkü istemci doğrulaması güvenlik sınırı sayılmaz.
 */
export class CreateOfferDto {
  @ApiProperty()
  @IsUUID()
  jobRequestId!: string;

  @ApiProperty({ description: 'Kuruş cinsinden teklif tutarı.' })
  @Type(() => Number)
  @IsInt()
  @Min(OFFER.minAmountMinor)
  @Max(OFFER.maxAmountMinor)
  amountMinor!: number;

  @ApiPropertyOptional({ enum: OfferPriceType, default: OfferPriceType.FIXED })
  @IsOptional()
  @IsEnum(OfferPriceType)
  priceType: OfferPriceType = OfferPriceType.FIXED;

  @ApiPropertyOptional({ minimum: MIN_DURATION_MINUTES, maximum: MAX_DURATION_MINUTES })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_DURATION_MINUTES)
  @Max(MAX_DURATION_MINUTES)
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ description: 'Satıcının işe başlayabileceği en erken tarih.' })
  @IsOptional()
  @IsISO8601()
  availableFrom?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  materialsIncluded = false;

  @ApiPropertyOptional({ maxLength: OFFER.maxNoteLength })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(OFFER.maxNoteLength)
  note?: string;

  @ApiPropertyOptional({
    default: OFFER.defaultValidityHours,
    minimum: OFFER.minValidityHours,
    maximum: OFFER.maxValidityHours,
    description: 'Teklifin kaç saat geçerli olacağı.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(OFFER.minValidityHours)
  @Max(OFFER.maxValidityHours)
  validityHours: number = OFFER.defaultValidityHours;
}

export class RejectOfferDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AcceptOfferDto {
  @ApiPropertyOptional({ description: 'Kararlaştırılan randevu zamanı.' })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}
