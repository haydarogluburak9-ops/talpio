import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAgentThreadDto {
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}

export class PostAgentMessageDto {
  @ApiProperty({ minLength: 1, maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}

export class AiDraftPromptDto {
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
  unitPriceMinor?: number;

  @ApiPropertyOptional()
  @IsOptional()
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

export class SalesCoachDto {
  @ApiProperty()
  @IsString()
  businessId!: string;
}
