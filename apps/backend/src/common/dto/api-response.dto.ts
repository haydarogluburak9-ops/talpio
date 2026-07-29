import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { AppErrorDetail } from '../errors/app.exception';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasNext: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | CursorMeta | Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: AppErrorDetail[];
  };
  requestId?: string;
}

/** Swagger dokümantasyonu için zarf gövdeleri. */
export class ApiErrorBodyDto {
  @ApiProperty({ example: 'OFFER_ALREADY_ACCEPTED' })
  code!: string;

  @ApiProperty({ example: 'Bu iş için zaten bir usta seçilmiş.' })
  message!: string;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' } })
  details?: AppErrorDetail[];
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: ApiErrorBodyDto })
  error!: ApiErrorBodyDto;

  @ApiPropertyOptional({ example: '01J8XZK3N7Q2R5V8YB1C4D6E9F' })
  requestId?: string;
}

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 134 }) total!: number;
  @ApiProperty({ example: 7 }) totalPages!: number;
  @ApiProperty({ example: true }) hasNext!: boolean;
  @ApiProperty({ example: false }) hasPrevious!: boolean;
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/** Servis katmanının liste dönüş tipi; interceptor bunu zarfa çevirir. */
export class PaginatedResult<T> {
  constructor(
    readonly items: T[],
    readonly meta: PaginationMeta,
  ) {}

  static of<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return new PaginatedResult(items, buildPaginationMeta(total, page, limit));
  }
}
