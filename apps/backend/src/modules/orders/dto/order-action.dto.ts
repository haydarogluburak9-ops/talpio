import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class PayOrderDto {
  @ApiPropertyOptional({
    description: 'Aynı ödemenin iki kez alınmasını engelleyen istemci anahtarı.',
    maxLength: 64,
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  idempotencyKey?: string;

  @ApiPropertyOptional({ description: 'Kararlaştırılan randevu zamanı.' })
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;
}

export class CompleteOrderDto {
  @ApiPropertyOptional({ maxLength: 1000, description: 'Satıcının iş teslim notu.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class CancelOrderDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  reason?: string;
}
