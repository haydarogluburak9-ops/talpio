import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_LOCALES } from '@talpio/config';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export function normalizeEmail({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function trimText({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegisterDto {
  @ApiProperty({ example: 'kullanici@talpio.com' })
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

  @ApiProperty({ example: 'ayse.yilmaz', description: 'Profil kullanıcı adı (@handle)' })
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-z0-9._]+$/, { message: 'Kullanıcı adı yalnızca küçük harf, rakam, nokta ve alt çizgi içerebilir.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  username!: string;

  @ApiPropertyOptional({ example: '+905321234567', description: 'E.164 biçiminde' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Telefon numarası +905321234567 biçiminde olmalıdır.' })
  phone?: string;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsIn([...SUPPORTED_LOCALES])
  locale?: string;

  @ApiPropertyOptional({ type: [String], minItems: 3, maxItems: 12, description: 'İlgi alanı kategori kimlikleri' })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(3, { message: 'En az 3 ilgi alanı seçin.' })
  @ArrayMaxSize(12)
  @IsUUID('all', { each: true })
  interestCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Ticari e-posta / SMS ileti onayı' })
  @IsOptional()
  @IsBoolean()
  acceptedMarketing?: boolean;
}
