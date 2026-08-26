import { ApiProperty } from '@nestjs/swagger';
import { AUTH } from '@talpio/config';
import { IsString, MaxLength, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Oturum sahibinin hâlihazırdaki şifresi' })
  @IsString()
  @MinLength(1, { message: 'Mevcut şifre zorunludur.' })
  currentPassword!: string;

  @ApiProperty({ minLength: AUTH.minPasswordLength, example: 'Guclu1Parola!' })
  @IsString()
  @MinLength(AUTH.minPasswordLength, {
    message: `Şifre en az ${AUTH.minPasswordLength} karakter olmalıdır.`,
  })
  @MaxLength(AUTH.maxPasswordLength, { message: 'Şifre çok uzun.' })
  // Harf sınıfları `@talpio/validation` içindeki `passwordSchema` ile aynıdır:
  // istemci Türkçe büyük/küçük harfi geçerli saydığı için sunucu daha katı
  // olursa form onayladığı şifreyi sunucu reddeder.
  @Matches(/[a-zçğıöşü]/, { message: 'Şifre en az bir küçük harf içermelidir.' })
  @Matches(/[A-ZÇĞİÖŞÜ]/, { message: 'Şifre en az bir büyük harf içermelidir.' })
  @Matches(/\d/, { message: 'Şifre en az bir rakam içermelidir.' })
  password!: string;
}
