import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, Length, Matches, ValidateIf } from 'class-validator';
import { CURRENCY_CODES, SUPPORTED_LOCALES } from '@talpio/config';

/** Kırpar; boş metin "temizle" niyetidir, biçim doğrulamasına sokulmadan null olur. */
const trimToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/** Kod alanları için: kırpar, büyütür, boşu null yapar. */
const trimToUpperOrNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toUpperCase();
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

  // Liste `SUPPORTED_LOCALES`ten türer. Sabit `['tr','en']` yazılıydı ve
  // Almanca, İspanyolca, Fransızca, Arapça arayüzü olmasına rağmen kullanıcı
  // bu dilleri kaydedemiyordu.
  @ApiPropertyOptional({ enum: SUPPORTED_LOCALES })
  @IsOptional()
  @IsIn(SUPPORTED_LOCALES)
  locale?: string;

  @ApiPropertyOptional({
    enum: CURRENCY_CODES,
    description: 'ISO 4217. `null` otomatik türetmeye döner.',
  })
  @IsOptional()
  @Transform(trimToUpperOrNull)
  @ValidateIf((_, value) => value !== null)
  @IsIn(CURRENCY_CODES)
  currency?: string | null;

  @ApiPropertyOptional({
    example: 'DE',
    description: 'ISO 3166-1 alpha-2. Para birimi seçilmemişse varsayılanı belirler.',
  })
  @IsOptional()
  @Transform(trimToUpperOrNull)
  @ValidateIf((_, value) => value !== null)
  @Matches(/^[A-Z]{2}$/, { message: 'Ülke kodu iki harfli olmalıdır.' })
  countryCode?: string | null;
}
