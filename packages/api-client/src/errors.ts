import { ERROR_CODES } from '@talpio/types';
import type { ApiErrorBody, ApiErrorDetail, ErrorCode } from '@talpio/types';

/**
 * İstemci tarafındaki tek hata tipi. Arayüz kararlarını `code` üzerinden verir;
 * `message` doğrudan kullanıcıya gösterilebilir.
 */
export class ApiError extends Error {
  readonly code: ErrorCode | string;
  readonly status: number;
  readonly details: ApiErrorDetail[];
  readonly requestId?: string;

  constructor(params: {
    code: ErrorCode | string;
    message: string;
    status: number;
    details?: ApiErrorDetail[];
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.details = params.details ?? [];
    if (params.requestId !== undefined) this.requestId = params.requestId;
  }

  /** Form alanlarına bağlanabilir doğrulama hataları. */
  get fieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.field) result[detail.field] = detail.issue;
    }
    return result;
  }

  get isValidationError(): boolean {
    return this.code === ERROR_CODES.VALIDATION_ERROR;
  }

  get isAuthError(): boolean {
    return this.status === 401;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  static network(message = 'Sunucuya ulaşılamıyor. Bağlantınızı kontrol edin.'): ApiError {
    return new ApiError({ code: ERROR_CODES.SERVICE_UNAVAILABLE, message, status: 0 });
  }

  static timeout(message = 'İstek zaman aşımına uğradı.'): ApiError {
    return new ApiError({ code: ERROR_CODES.SERVICE_UNAVAILABLE, message, status: 0 });
  }

  static fromBody(body: ApiErrorBody, status: number, requestId?: string): ApiError {
    return new ApiError({
      code: body.code,
      message: body.message,
      status,
      details: body.details ?? [],
      ...(requestId !== undefined ? { requestId } : {}),
    });
  }

  static fromStatus(status: number, requestId?: string): ApiError {
    const fallback: Record<number, { code: ErrorCode; message: string }> = {
      400: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Geçersiz istek.' },
      401: { code: ERROR_CODES.UNAUTHORIZED, message: 'Oturum açmanız gerekiyor.' },
      403: { code: ERROR_CODES.FORBIDDEN, message: 'Bu işlem için yetkiniz yok.' },
      404: { code: ERROR_CODES.NOT_FOUND, message: 'Kayıt bulunamadı.' },
      409: { code: ERROR_CODES.CONFLICT, message: 'İşlem mevcut durumla çakışıyor.' },
      422: { code: ERROR_CODES.VALIDATION_ERROR, message: 'Gönderilen bilgiler geçerli değil.' },
      429: { code: ERROR_CODES.RATE_LIMITED, message: 'Çok fazla istek gönderildi.' },
      503: { code: ERROR_CODES.SERVICE_UNAVAILABLE, message: 'Servis şu anda kullanılamıyor.' },
    };

    const mapped = fallback[status] ?? {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Beklenmeyen bir hata oluştu.',
    };

    return new ApiError({
      ...mapped,
      status,
      ...(requestId !== undefined ? { requestId } : {}),
    });
  }
}

export function isApiErrorInstance(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
