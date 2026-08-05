import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JobRequestStatus,
  NotificationChannel,
  NotificationType,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  ReviewStatus,
  TransactionType,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@ustapilot/types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

/** Virgülle ayrılmış çoklu değer; sorgu dizgisinde dizi taşımanın en kısa yolu. */
const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class ListAdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(UserRole, { each: true })
  role?: UserRole[];

  @ApiPropertyOptional({ enum: UserStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(UserStatus, { each: true })
  status?: UserStatus[];
}

export class ListAdminProvidersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VerificationStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(VerificationStatus, { each: true })
  verificationStatus?: VerificationStatus[];
}

export class ListAdminJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: JobRequestStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(JobRequestStatus, { each: true })
  status?: JobRequestStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;
}

export class ListAdminOffersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OfferStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(OfferStatus, { each: true })
  status?: OfferStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  jobRequestId?: string;
}

export class ListAdminOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(OrderStatus, { each: true })
  status?: OrderStatus[];
}

export class ListAdminPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(PaymentStatus, { each: true })
  status?: PaymentStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

export class ListAdminTransactionsQueryDto extends PaginationQueryDto {
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

/** Komisyon kuralları salt okunur listelenir; süzgeç yalnızca etkinlik durumudur. */
export class ListAdminCommissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Yalnızca etkin kurallar.' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class ListAdminNotificationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: NotificationType, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(NotificationType, { each: true })
  type?: NotificationType[];

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(NotificationChannel, { each: true })
  channel?: NotificationChannel[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Yalnızca okunmamışlar.' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  unread?: boolean;
}

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Belirli bir varlık türünün kayıtları.' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  actorId?: string;
}

export class ListAdminReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ReviewStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(ReviewStatus, { each: true })
  status?: ReviewStatus[];
}

/** Panelden uygulanan yayın / gizleme kararları. */
export const MODERATABLE_REVIEW_STATUSES = [ReviewStatus.PUBLISHED, ReviewStatus.HIDDEN] as const;

export class UpdateReviewModerationDto {
  @ApiProperty({ enum: MODERATABLE_REVIEW_STATUSES })
  @IsIn(MODERATABLE_REVIEW_STATUSES)
  status!: (typeof MODERATABLE_REVIEW_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Denetim kaydına ve satıra yazılan gerekçe.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationNote?: string;
}

export class UpdateSystemSettingDto {
  @ApiProperty({ description: 'Ayar anahtarı.' })
  @IsString()
  @MaxLength(120)
  key!: string;

  @ApiProperty({ description: 'JSON değeri.' })
  @IsDefined()
  value!: unknown;
}

/**
 * Yönetimin değiştirebileceği hesap durumları.
 *
 * `PENDING_VERIFICATION` ve `DEACTIVATED` burada yer almaz: ilki kayıt akışının,
 * ikincisi kullanıcının kendi kararının sonucudur.
 */
export const MANAGEABLE_USER_STATUSES = [
  UserStatus.ACTIVE,
  UserStatus.SUSPENDED,
  UserStatus.BANNED,
] as const;

export class UpdateUserStatusDto {
  @ApiProperty({ enum: MANAGEABLE_USER_STATUSES })
  @IsIn(MANAGEABLE_USER_STATUSES)
  status!: (typeof MANAGEABLE_USER_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Denetim kaydına yazılan gerekçe.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Doğrulama kararı yalnızca sonuçlanmış iki değeri alabilir. */
export const DECIDABLE_VERIFICATION_STATUSES = [
  VerificationStatus.VERIFIED,
  VerificationStatus.REJECTED,
] as const;

export class UpdateVerificationDto {
  @ApiProperty({ enum: DECIDABLE_VERIFICATION_STATUSES })
  @IsIn(DECIDABLE_VERIFICATION_STATUSES)
  verificationStatus!: (typeof DECIDABLE_VERIFICATION_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Denetim kaydına yazılan gerekçe.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
