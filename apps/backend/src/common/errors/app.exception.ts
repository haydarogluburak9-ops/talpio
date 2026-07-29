import { HttpException } from '@nestjs/common';

import { ERROR_CODE_STATUS, type ErrorCode } from './error-codes';

export interface AppErrorDetail {
  field?: string;
  issue: string;
}

export interface AppExceptionOptions {
  /** Kullanıcıya gösterilecek mesaj. Verilmezse kod adı kullanılır. */
  message?: string;
  details?: AppErrorDetail[];
  /** Log'a yazılacak, istemciye gönderilmeyen bağlam. */
  context?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Uygulama içinde fırlatılan tüm beklenen hatalar bu sınıfı kullanır.
 * Böylece istemci her zaman sabit bir `code` alanı görür.
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly details?: AppErrorDetail[];
  readonly context?: Record<string, unknown>;

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    const status = ERROR_CODE_STATUS[code];
    super({ code, message: options.message ?? code }, status, { cause: options.cause });

    this.code = code;
    if (options.details) {
      this.details = options.details;
    }
    if (options.context) {
      this.context = options.context;
    }
  }

  static notFound(resource: string, id?: string): AppException {
    return new AppException('NOT_FOUND', {
      message: `${resource} bulunamadı.`,
      ...(id ? { context: { resource, id } } : { context: { resource } }),
    });
  }

  static forbiddenResource(resource: string, context?: Record<string, unknown>): AppException {
    return new AppException('FORBIDDEN_RESOURCE', {
      message: 'Bu kaynağa erişim yetkiniz yok.',
      context: { resource, ...context },
    });
  }
}
