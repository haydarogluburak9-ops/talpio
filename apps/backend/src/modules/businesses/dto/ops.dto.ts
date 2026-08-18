import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  BusinessTaskPriority,
  BusinessTaskStatus,
  CampaignAudience,
  CampaignStatus,
  CrmCustomerSource,
  WorkOrderSource,
  WorkOrderStage,
} from '@talpio/types';

export class CreateCrmCustomerDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  email?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional({ enum: CrmCustomerSource })
  @IsOptional()
  @IsEnum(CrmCustomerSource)
  source?: (typeof CrmCustomerSource)[keyof typeof CrmCustomerSource];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCrmNoteDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fileAssetId?: string | null;
}

export class CreateCrmFollowUpDto {
  @ApiProperty()
  @IsString()
  dueAt!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class CreateWorkOrderDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ enum: WorkOrderSource })
  @IsOptional()
  @IsEnum(WorkOrderSource)
  source?: (typeof WorkOrderSource)[keyof typeof WorkOrderSource];

  @ApiPropertyOptional({ enum: WorkOrderStage })
  @IsOptional()
  @IsEnum(WorkOrderStage)
  stage?: (typeof WorkOrderStage)[keyof typeof WorkOrderStage];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scheduledAt?: string | null;
}

export class UpdateWorkOrderStageDto {
  @ApiProperty({ enum: WorkOrderStage })
  @IsEnum(WorkOrderStage)
  stage!: (typeof WorkOrderStage)[keyof typeof WorkOrderStage];
}

export class AssignWorkOrderDto {
  @ApiProperty()
  @IsUUID()
  assigneeUserId!: string;
}

export class CreateBusinessTaskDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  workOrderId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeUserId?: string | null;

  @ApiPropertyOptional({ enum: BusinessTaskPriority })
  @IsOptional()
  @IsEnum(BusinessTaskPriority)
  priority?: (typeof BusinessTaskPriority)[keyof typeof BusinessTaskPriority];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueAt?: string | null;
}

export class UpdateBusinessTaskStatusDto {
  @ApiProperty({ enum: BusinessTaskStatus })
  @IsEnum(BusinessTaskStatus)
  status!: (typeof BusinessTaskStatus)[keyof typeof BusinessTaskStatus];
}

export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string | null;

  @ApiPropertyOptional({ enum: CampaignAudience })
  @IsOptional()
  @IsEnum(CampaignAudience)
  audience?: (typeof CampaignAudience)[keyof typeof CampaignAudience];

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: (typeof CampaignStatus)[keyof typeof CampaignStatus];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startsAt?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endsAt?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  postIds?: string[];
}

export class AiDraftRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  prompt!: string;
}

export class AiOfferDraftDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  prompt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  unitPriceMinor?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;
}
