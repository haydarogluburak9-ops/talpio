import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Web istemcisinde yenileme jetonu HTTP-only çerezle taşınır ve gövde boş
 * gelir; mobilde gövdeye konur. Bu yüzden alan isteğe bağlıdır.
 */
export class RefreshDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  refreshToken?: string;
}
