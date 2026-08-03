import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';
import { UserRole } from '@ustapilot/types';

/** Kayıt sırasında seçilebilen roller. Personel rolleri yalnızca admin atar. */
const SELF_SERVICE_ROLES = [UserRole.CUSTOMER, UserRole.PROVIDER] as const;

export function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function trimText({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegisterDto {
  @ApiProperty({ example: 'musteri@ustapilot.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin.' })
  @Transform(normalizeEmail)
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Guclu1Parola!' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @Matches(/[a-z]/, { message: 'Şifre en az bir küçük harf içermelidir.' })
  @Matches(/[A-Z]/, { message: 'Şifre en az bir büyük harf içermelidir.' })
  @Matches(/\d/, { message: 'Şifre en az bir rakam içermelidir.' })
  password!: string;

  @ApiProperty({ example: 'Ayşe Yılmaz' })
  @IsString()
  @Length(2, 120)
  @Transform(trimText)
  fullName!: string;

  @ApiProperty({ enum: SELF_SERVICE_ROLES, example: UserRole.CUSTOMER })
  @IsIn(SELF_SERVICE_ROLES, { message: 'Geçersiz rol seçimi.' })
  role!: (typeof SELF_SERVICE_ROLES)[number];

  @ApiPropertyOptional({ example: '+905321234567', description: 'E.164 biçiminde' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Telefon numarası +905321234567 biçiminde olmalıdır.' })
  phone?: string;

  @ApiPropertyOptional({ example: 'tr' })
  @IsOptional()
  @IsIn(['tr', 'en'])
  locale?: string;
}
