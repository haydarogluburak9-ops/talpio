import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { type ApiErrorResponse } from '../dto/api-response.dto';
import { AppException, type AppErrorDetail } from '../errors/app.exception';
import { ERROR_CODES, type ErrorCode } from '../errors/error-codes';

interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: AppErrorDetail[];
  logContext?: Record<string, unknown>;
}

/**
 * Tek çıkış noktası: her hata istemciye aynı biçimde döner.
 * Beklenmeyen hatalarda iç detaylar log'da kalır, istemciye sızmaz.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const normalized = this.normalize(exception);
    const requestId = this.resolveRequestId(request);

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details?.length ? { details: normalized.details } : {}),
      },
      ...(requestId ? { requestId } : {}),
    };

    const logPayload = {
      requestId,
      method: request.method,
      path: request.url,
      status: normalized.status,
      code: normalized.code,
      ...normalized.logContext,
    };

    if (normalized.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logPayload, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(logPayload);
    }

    response.status(normalized.status).json(body);
  }

  private resolveRequestId(request: Request): string | undefined {
    const id = (request as Request & { id?: unknown }).id;
    return typeof id === 'string' ? id : undefined;
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: this.extractMessage(exception),
        ...(exception.details ? { details: exception.details } : {}),
        ...(exception.context ? { logContext: exception.context } : {}),
      };
    }

    if (exception instanceof ThrottlerException) {
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Çok fazla istek gönderdiniz. Lütfen biraz sonra tekrar deneyin.',
      };
    }

    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
      ...(this.isProduction
        ? {}
        : {
            logContext: { raw: exception instanceof Error ? exception.message : String(exception) },
          }),
    };
  }

  private fromHttpException(exception: HttpException): NormalizedError {
    const status = exception.getStatus();
    const payload = exception.getResponse();

    // ValidationPipe çıktısı: { message: string[], error: string, statusCode: number }
    if (status === HttpStatus.BAD_REQUEST && this.isValidationPayload(payload)) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Gönderilen bilgiler geçerli değil.',
        details: payload.message.map((issue) => ({ issue })),
      };
    }

    if (typeof payload === 'object' && payload !== null && 'code' in payload) {
      const typed = payload as { code: string; message?: string };
      return {
        status,
        code: typed.code,
        message: typed.message ?? exception.message,
      };
    }

    return {
      status,
      code: this.statusToCode(status),
      message: typeof payload === 'string' ? payload : exception.message,
    };
  }

  private isValidationPayload(payload: unknown): payload is { message: string[] } {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      Array.isArray(payload.message)
    );
  }

  private statusToCode(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ERROR_CODES.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMITED;
      case HttpStatus.SERVICE_UNAVAILABLE:
        return ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return ERROR_CODES.INTERNAL_ERROR;
    }
  }

  private extractMessage(exception: AppException): string {
    const payload = exception.getResponse();
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const { message } = payload;
      if (typeof message === 'string') return message;
    }
    return exception.message;
  }
}
