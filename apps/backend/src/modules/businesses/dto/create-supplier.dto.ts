import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSupplierBusinessDto {
  @ApiProperty({ example: 'Atlas Lubricants' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  categoryIds!: string[];

  @ApiPropertyOptional({ type: [String], description: 'İlçe kimlikleri; boşsa yalnızca şehir' })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  districtIds?: string[];

  @ApiPropertyOptional({ description: 'Hizmet verilen şehir' })
  @IsOptional()
  @IsUUID()
  cityId?: string;
}
