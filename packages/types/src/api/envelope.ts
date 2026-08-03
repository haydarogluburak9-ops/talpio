import type { ErrorCode } from './error-codes';

/** Sayfalama üst verisi. Liste döndüren tüm uçlar bunu `meta` içinde verir. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorBody {
  code: ErrorCode | string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Sayfalı liste sonucu. Servis katmanı bu şekli döner, interceptor zarflar. */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}
