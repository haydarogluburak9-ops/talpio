import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { REVIEW, UPLOAD } from '@talpio/config';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const RATING_RANGE = { minimum: REVIEW.minRating, maximum: REVIEW.maxRating };

export class ReviewRatingsDto {
  @ApiProperty(RATING_RANGE)
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW.minRating)
  @Max(REVIEW.maxRating)
  quality!: number;

  @ApiProperty(RATING_RANGE)
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW.minRating)
  @Max(REVIEW.maxRating)
  punctuality!: number;

  @ApiProperty(RATING_RANGE)
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW.minRating)
  @Max(REVIEW.maxRating)
  communication!: number;

  @ApiProperty(RATING_RANGE)
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW.minRating)
  @Max(REVIEW.maxRating)
  valueForMoney!: number;

  @ApiProperty(RATING_RANGE)
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW.minRating)
  @Max(REVIEW.maxRating)
  tidiness!: number;
}

/**
 * Değerlendirme gövdesi.
 *
 * Kurallar `@talpio/validation` içindeki `createReviewSchema` ile aynıdır;
 * istemciler formu o Zod şemasıyla doğrular, backend aynı sınırları burada
 * yeniden uygular çünkü istemci doğrulaması güvenlik sınırı sayılmaz.
 */
export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  orderId!: string;

  @ApiProperty({ type: ReviewRatingsDto })
  @ValidateNested()
  @Type(() => ReviewRatingsDto)
  ratings!: ReviewRatingsDto;

  @ApiPropertyOptional({ maxLength: REVIEW.maxCommentLength })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(REVIEW.maxCommentLength)
  comment?: string;

  @ApiPropertyOptional({ type: [String], maxItems: UPLOAD.maxReviewPhotos })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(UPLOAD.maxReviewPhotos)
  @IsUUID(undefined, { each: true })
  photoFileIds: string[] = [];
}

export class ReplyToReviewDto {
  @ApiProperty({ minLength: 2, maxLength: REVIEW.maxReplyLength })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(REVIEW.maxReplyLength)
  body!: string;
}
