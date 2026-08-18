import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength, Matches } from 'class-validator';

export class UpdateBusinessLocaleSettingsDto {
  @ApiPropertyOptional({ example: 'TRY' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: 'TR' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  defaultCountryCode?: string;

  @ApiPropertyOptional({ example: 'Europe/Istanbul' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  defaultTimezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  taxId?: string | null;
}
