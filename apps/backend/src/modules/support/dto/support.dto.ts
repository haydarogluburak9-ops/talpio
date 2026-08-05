import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintStatus, ComplaintSubjectType, SupportTicketStatus } from '@ustapilot/types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value;

export class CreateSupportTicketDto {
  @ApiProperty({ minLength: 5, maxLength: 160 })
  @Transform(trim)
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  subject!: string;

  @ApiProperty({ minLength: 10, maxLength: 4000 })
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID(undefined, { each: true })
  attachmentFileIds: string[] = [];
}

export class SupportTicketReplyDto {
  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional({ type: [String], maxItems: 5 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID(undefined, { each: true })
  attachmentFileIds: string[] = [];
}

export class ListSupportTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SupportTicketStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(SupportTicketStatus, { each: true })
  status?: SupportTicketStatus[];
}

export class CreateComplaintDto {
  @ApiProperty({ enum: ComplaintSubjectType })
  @IsEnum(ComplaintSubjectType)
  subjectType!: ComplaintSubjectType;

  @ApiProperty()
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ minLength: 3, maxLength: 120 })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  reason!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class ListComplaintsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ComplaintStatus, isArray: true })
  @IsOptional()
  @Transform(toArray)
  @IsEnum(ComplaintStatus, { each: true })
  status?: ComplaintStatus[];
}

export class UpdateSupportTicketDto {
  @ApiPropertyOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  assignedToUserId?: string | null;
}

export class UpdateComplaintDto {
  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  resolutionNote?: string;
}
