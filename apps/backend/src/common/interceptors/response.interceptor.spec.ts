import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';

import { PaginatedResult } from '../dto/api-response.dto';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let reflector: Reflector;
  let interceptor: ResponseInterceptor<unknown>;

  const context = {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;

  const handlerReturning = (value: unknown): CallHandler => ({ handle: () => of(value) });

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new ResponseInterceptor(reflector);
  });

  it('düz veriyi başarı zarfına sarar', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const result = await firstValueFrom(
      interceptor.intercept(context, handlerReturning({ id: '1' })),
    );

    expect(result).toEqual({ success: true, data: { id: '1' } });
  });

  it('undefined dönen uçlarda data alanını null yapar', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const result = await firstValueFrom(
      interceptor.intercept(context, handlerReturning(undefined)),
    );

    expect(result).toEqual({ success: true, data: null });
  });

  it('sayfalı sonuçlarda meta alanını doldurur', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const paginated = PaginatedResult.of([{ id: '1' }, { id: '2' }], 45, 2, 20);

    const result = await firstValueFrom(
      interceptor.intercept(context, handlerReturning(paginated)),
    );

    expect(result).toEqual({
      success: true,
      data: [{ id: '1' }, { id: '2' }],
      meta: {
        page: 2,
        limit: 20,
        total: 45,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      },
    });
  });

  it('RawResponse işaretli uçlarda gövdeyi değiştirmez', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const payload = { status: 'ok' };

    const result = await firstValueFrom(interceptor.intercept(context, handlerReturning(payload)));

    expect(result).toBe(payload);
  });
});
