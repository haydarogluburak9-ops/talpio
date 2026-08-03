import { ApiProperty } from '@nestjs/swagger';
import { FilePurpose } from '@ustapilot/types';
import { IsEnum } from 'class-validator';

/**
 * Yükleme gövdesi.
 *
 * Dosyanın kendisi `multipart/form-data` alanında gelir; burada yalnızca
 * amacı taşınır. Amaç, kabul edilen tür ve boyut sınırlarını belirler.
 */
export class UploadFileDto {
  @ApiProperty({ enum: FilePurpose })
  @IsEnum(FilePurpose)
  purpose!: FilePurpose;
}
