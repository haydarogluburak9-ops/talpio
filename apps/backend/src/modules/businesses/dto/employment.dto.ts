import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SearchBusinessesQueryDto {
  @ApiPropertyOptional({ description: 'Onaylı firma adı; en az iki karakter.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  q?: string;
}

export class DecideEmploymentDto {
  @ApiProperty({ description: 'true onaylar ve mavi tik verir, false reddeder.' })
  @IsBoolean()
  approve!: boolean;
}
