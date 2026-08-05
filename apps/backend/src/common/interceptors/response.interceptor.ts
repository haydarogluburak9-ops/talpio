import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';

import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';
import { type ApiSuccessResponse, PaginatedResult } from '../dto/api-response.dto';

/**
 * Tüm başarılı yanıtları `{ success, data, meta }` zarfına sarar.
 * `PaginatedResult` dönen servisler için `meta` otomatik doldurulur.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<unknown> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<unknown> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle();
    }

    return next.handle().pipe(
      map((payload): ApiSuccessResponse<unknown> => {
        if (payload instanceof PaginatedResult) {
          // `instanceof` jenerikleri siler; zarf tipi bilinçli olarak bilinmeyene daraltılır.
          const page = payload as PaginatedResult<unknown>;
          return { success: true, data: page.items, meta: page.meta };
        }
        return { success: true, data: payload ?? null };
      }),
    );
  }
}
