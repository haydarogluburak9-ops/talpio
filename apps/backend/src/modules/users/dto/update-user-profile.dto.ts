import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Length, Matches, ValidateIf } from 'class-validator';

/** Kırpar; boş metin "temizle" niyetidir, biçim doğrulamasına sokulmadan null olur. */
const trimToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Kullanıcının kendi profil güncellemesi.
 *
 * Kurallar `@talpio/validation` içindeki `updateUserProfileSchema` ile
 * aynıdır; istemci formu o şemayla doğrular, backend aynı sınırları burada
 * yeniden uygular çünkü istemci doğrulaması güvenlik sınırı sayılmaz.
 *
 * E-posta ve rol burada değişmez: e-posta doğrulama akışı, rol ise yönetim
 * kararı gerektirir.
 */
export class UpdateUserProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimToNull)
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @ApiPropertyOptional({
    example: '+905321234567',
    description: 'E.164 biçiminde. `null` numarayı kaldırır.',
  })
  @IsOptional()
  @Transform(trimToNull)
  @ValidateIf((_, value) => value !== null)
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Telefon numarası +905321234567 biçiminde olmalıdır.' })
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Yüklenmiş görselin kimliği. `null` görseli kaldırır.' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  avatarFileId?: string | null;

  @ApiPropertyOptional({ enum: ['tr', 'en'] })
  @IsOptional()
  @IsIn(['tr', 'en'])
  locale?: string;
}
