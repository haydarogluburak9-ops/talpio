import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { DocumentType } from '@talpio/types';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/** Kırpar; boş metin "temizle" niyetidir, uzunluk kuralına takılmadan null olur. */
const trimToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

/**
 * Sınırlar `@talpio/validation` içindeki `setProviderServicesSchema` ve
 * `setProviderServiceAreasSchema` ile aynıdır; istemci formu o şemayla doğrular,
 * backend aynı sınırları burada yeniden uygular çünkü istemci doğrulaması
 * güvenlik sınırı sayılmaz.
 */
export const MAX_PROVIDER_SERVICES = 20;
export const MAX_PROVIDER_SERVICE_AREAS = 200;

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({ description: 'İşletme adı. `null` gönderilirse kaldırılır.' })
  @IsOptional()
  @Transform(trimToNull)
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(160)
  businessName?: string | null;

  @ApiPropertyOptional({ description: 'Tanıtım metni. `null` gönderilirse kaldırılır.' })
  @IsOptional()
  @Transform(trimToNull)
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  about?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 70 })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  @Max(70)
  experienceYears?: number | null;

  @ApiPropertyOptional({ description: 'Acil işlere teklif vermek istiyor mu?' })
  @IsOptional()
  @IsBoolean()
  acceptsUrgentJobs?: boolean;

  @ApiPropertyOptional({ description: 'Fatura kesebiliyor mu?' })
  @IsOptional()
  @IsBoolean()
  canIssueInvoice?: boolean;
}

export class ProviderServiceInputDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  subcategoryId?: string | null;

  @ApiPropertyOptional({ description: 'Kuruş cinsinden başlangıç fiyatı.' })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Min(0)
  startingPriceMinor?: number | null;
}

/**
 * Hizmet listesinin tamamı gönderilir.
 *
 * Tek tek ekle/çıkar yerine toplu yazım seçildi: satıcı ekranında hizmetler bir
 * form olarak düzenlenir ve kısmi güncellemeler yarım kalan isteklerde tutarsız
 * bir liste bırakırdı.
 */
export class ReplaceProviderServicesDto {
  @ApiProperty({ type: [ProviderServiceInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir hizmet kategorisi seçmelisiniz.' })
  @ArrayMaxSize(MAX_PROVIDER_SERVICES)
  @ValidateNested({ each: true })
  @Type(() => ProviderServiceInputDto)
  services!: ProviderServiceInputDto[];
}

export class ReplaceProviderServiceAreasDto {
  @ApiProperty({ type: [String], description: 'Hizmet verilen ilçelerin kimlikleri.' })
  @IsArray()
  @ArrayMinSize(1, { message: 'En az bir hizmet bölgesi seçmelisiniz.' })
  @ArrayMaxSize(MAX_PROVIDER_SERVICE_AREAS)
  @IsUUID(undefined, { each: true })
  districtIds!: string[];
}

export class UploadProviderDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsIn(Object.values(DocumentType))
  type!: DocumentType;

  @ApiProperty()
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({ description: 'ISO 8601. Süresi dolan belgeler incelemede reddedilir.' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
