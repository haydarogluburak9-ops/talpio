import { Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { AppException } from '@common/errors/app.exception';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;
    return super.canActivate(context);
  }

  /**
   * Passport'un varsayılan `UnauthorizedException`'ı yerine standart hata
   * zarfını üretir; istemciler `TOKEN_EXPIRED` görünce sessizce yeniler.
   */
  override handleRequest<TUser>(err: unknown, user: TUser, info: unknown): TUser {
    if (user) return user;

    if (err instanceof AppException) throw err;

    const name = info instanceof Error ? info.name : undefined;

    if (name === 'TokenExpiredError') {
      throw new AppException('TOKEN_EXPIRED', { message: 'Oturum süreniz doldu.' });
    }

    throw new AppException('UNAUTHORIZED', { message: 'Bu işlem için giriş yapmalısınız.' });
  }
}
