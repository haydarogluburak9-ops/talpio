import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

import { normalizeEmail, trimText } from './register.dto';
import { Transform } from 'class-transformer';

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  token!: string;
}

export class RequestPhoneCodeDto {
  @ApiProperty({ example: '+905321234567' })
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Telefon numarası +905321234567 biçiminde olmalıdır.' })
  phone!: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ example: '+905321234567' })
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Telefon numarası +905321234567 biçiminde olmalıdır.' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'kullanici@talpio.com' })
  @IsEmail()
  @Transform(normalizeEmail)
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(16)
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @Matches(/[a-z]/)
  @Matches(/[A-Z]/)
  @Matches(/\d/)
  @Transform(trimText)
  password!: string;
}
