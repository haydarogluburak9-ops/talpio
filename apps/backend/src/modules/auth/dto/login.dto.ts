import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { normalizeEmail } from './register.dto';

export class LoginDto {
  @ApiProperty({ example: 'musteri@ustapilot.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  @Transform(normalizeEmail)
  email!: string;

  // Burada karmaşıklık kuralı uygulanmaz: mevcut parolalar farklı politikalarla
  // oluşturulmuş olabilir, tek sınır kaba kuvvet yükünü sınırlamaktır.
  @ApiProperty({ example: 'Guclu1Parola!' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password!: string;

  @ApiPropertyOptional({ description: 'Cihazı ayırt eden istemci üretimi kimlik' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  deviceId?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  deviceName?: string;
}
