import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@ustapilot/types';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  /**
   * Expo push jetonu (`ExponentPushToken[…]`) veya ham FCM/APNs jetonu.
   * Biçim sağlayıcıya göre değiştiği için yalnızca uzunluk sınırlanır.
   */
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  @Length(16, 512)
  token!: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  /** Push metni cihazın dilinde üretilir; boş bırakılırsa hesabın dili kullanılır. */
  @ApiPropertyOptional({ example: 'tr' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;
}

export class RemoveDeviceTokenDto {
  @ApiProperty()
  @IsString()
  @Length(16, 512)
  token!: string;
}
