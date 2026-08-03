import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JobRequestStatus,
  OfferStatus,
  OrderStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@ustapilot/types';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

/** Virgülle ayrılmış çoklu değer; sorgu dizgisinde dizi taşımanın en kısa yolu. */
const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

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
