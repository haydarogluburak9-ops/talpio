import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ContentReportTarget, PostType } from '@talpio/types';

export class DealMetadataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  productName?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string | null;

  @ApiPropertyOptional({ description: 'Liste fiyatı (kuruş)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  listPriceMinor?: number | null;

  @ApiPropertyOptional({ description: 'Fırsat fiyatı (kuruş)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  dealPriceMinor?: number | null;

  @ApiPropertyOptional({ description: 'İndirim yüzdesi 0–100' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent?: number | null;

  @ApiPropertyOptional({ default: 'TRY' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @MinLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  minQuantity?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  maxQuantity?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  deliveryRegions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  stockQuantity?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vatIncluded?: boolean | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  shippingIncluded?: boolean | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationText?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subcategoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null;
}

export class CreatePostDto {
  @ApiPropertyOptional({ enum: PostType, default: PostType.TEXT })
  @IsOptional()
  @IsEnum(PostType)
  type?: (typeof PostType)[keyof typeof PostType];

  @ApiPropertyOptional({
    description: 'Varsa gönderi mağaza (BUSINESS) profilinden yayınlanır',
  })
  @IsOptional()
  @IsUUID()
  businessId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('all', { each: true })
  mediaFileIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  commerceRequestId?: string;

  @ApiPropertyOptional({ description: 'Kampanya / indirim etiketi (legacy)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  promoLabel?: string;

  @ApiPropertyOptional({ description: 'Eski fiyat (kuruş, legacy)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalPriceMinor?: number;

  @ApiPropertyOptional({ description: 'Özel / indirimli fiyat (kuruş, legacy)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  promoPriceMinor?: number;

  @ApiPropertyOptional({ default: 'TRY' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  @MinLength(3)
  promoCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  promoValidUntil?: string;

  @ApiPropertyOptional({ type: DealMetadataDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DealMetadataDto)
  deal?: DealMetadataDto;

  @ApiPropertyOptional({ description: 'Repost veya alıntı için kaynak gönderi' })
  @IsOptional()
  @IsUUID()
  originalPostId?: string;
}

export class CreateStoryHighlightDto {
  @ApiProperty({ description: 'Öne çıkan koleksiyon adı' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title!: string;

  @ApiPropertyOptional({ description: 'İlk hikâye gönderisi' })
  @IsOptional()
  @IsUUID()
  postId?: string;

  @ApiPropertyOptional({ description: 'Kapak görseli dosya kimliği' })
  @IsOptional()
  @IsUUID()
  coverFileId?: string;
}

export class UpdateStoryHighlightDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coverFileId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class AddStoryHighlightItemDto {
  @ApiProperty({ description: 'Öne çıkana eklenecek gönderi' })
  @IsUUID()
  postId!: string;
}

export class CreateRequestFromPostDto {
  @ApiPropertyOptional({ description: 'true ise draft yerine yayınlar' })
  @IsOptional()
  @IsBoolean()
  publish?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;
}

export class ShareRequestToFeedDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  body?: string;
}

export class UpdateSocialProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-z0-9._]+$/)
  username?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationCityId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationText?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  headline?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  avatarFileId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  coverFileId?: string | null;
}

class ProfileCareerDatesDto {
  @ApiProperty({ example: 2020 })
  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear!: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  endYear?: number | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProfileExperienceDto extends ProfileCareerDatesDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  company!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateProfileExperienceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  locationText?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  endYear?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProfileEducationDto extends ProfileCareerDatesDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  school!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  degree?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fieldOfStudy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateProfileEducationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  school?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  degree?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fieldOfStudy?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  startYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  startMonth?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  endYear?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  endMonth?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProfileSkillDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateProfileSkillDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class CreateContentReportDto {
  @ApiProperty({ enum: ContentReportTarget })
  @IsEnum(ContentReportTarget)
  targetType!: (typeof ContentReportTarget)[keyof typeof ContentReportTarget];

  @ApiProperty()
  @IsUUID()
  targetId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

export class FeedQueryDto {
  @ApiPropertyOptional({ description: 'Önceki sayfanın son kaydının kimliği' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class DiscoverFeedQueryDto extends FeedQueryDto {}

export class SearchProfilesQueryDto {
  @ApiProperty({ description: 'Kullanıcı adı veya görünen ad', minLength: 2, maxLength: 60 })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  q!: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export class CreateGroupConversationDto {
  @ApiProperty({ minLength: 2, maxLength: 80 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title!: string;

  @ApiProperty({ type: [String], minItems: 2, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  memberIds!: string[];
}

export class AddGroupMembersDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  memberIds!: string[];
}

export class RecordViewsDto {
  @ApiProperty({ type: [String], minItems: 1, maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsUUID('all', { each: true })
  postIds!: string[];
}

export class ReplaceInterestsDto {
  @ApiProperty({ type: [String], minItems: 3, maxItems: 12 })
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(12)
  @IsUUID('all', { each: true })
  categoryIds!: string[];
}

export class TrendingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}

export class ListSocialQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: ['posts', 'deals', 'campaigns', 'portfolio'] })
  @IsOptional()
  @IsString()
  @IsIn(['posts', 'deals', 'campaigns', 'portfolio'])
  tab?: 'posts' | 'deals' | 'campaigns' | 'portfolio';

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
