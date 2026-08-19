import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'kullanici@talpio.com',
    description: 'Kullanıcı adı (@handle), e-posta veya E.164 telefon numarası',
  })
  @IsString({ message: 'Giriş bilgisi zorunludur.' })
  @MinLength(1, { message: 'Giriş bilgisi zorunludur.' })
  @MaxLength(254)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  identifier!: string;

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
