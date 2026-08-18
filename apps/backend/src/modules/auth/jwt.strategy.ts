import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { UserRole } from '@talpio/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { RbacService } from '@modules/rbac/rbac.service';

import type { AccessTokenPayload } from './token.service';

const ACCESS_COOKIE = 'talpio_access';

function accessTokenFromCookie(request: Request): string | null {
  const cookies: unknown = (request as { cookies?: unknown }).cookies;
  if (typeof cookies !== 'object' || cookies === null) return null;

  const value = (cookies as Record<string, unknown>)[ACCESS_COOKIE];
  return typeof value === 'string' ? value : null;
}

/** İstek boyunca taşınan kimlik bilgisi. Controller'lar `@CurrentUser()` ile alır. */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  sessionId: string;
  /** PermissionsGuard / RbacService tarafından doldurulabilir. */
  permissionCodes?: readonly string[];
  platformRoleCodes?: readonly string[];
  businessIds?: readonly string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: AppConfigService,
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {
    super({
      // Mobil `Authorization` başlığı gönderir; tarayıcı jetona hiç dokunmadığı
      // için HTTP-only çerezden okunur.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        accessTokenFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * İmza geçerli olsa bile oturum iptal edilmiş olabilir (çıkış yapıldı, parola
   * değişti, hesap askıya alındı). Bu yüzden her istekte oturum doğrulanır.
   */
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: payload.sid, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        user: { select: { id: true, role: true, status: true, deletedAt: true } },
      },
    });

    if (!session || session.user.deletedAt) {
      throw new AppException('TOKEN_INVALID', { message: 'Oturumunuz geçersiz.' });
    }

    if (session.user.status === 'SUSPENDED' || session.user.status === 'BANNED') {
      throw new AppException('ACCOUNT_SUSPENDED', { message: 'Hesabınız askıya alınmış.' });
    }

    const effective = await this.rbac.getEffectivePermissions(session.user.id);

    return {
      id: session.user.id,
      role: session.user.role,
      sessionId: session.id,
      permissionCodes: [...effective.permissionCodes],
      platformRoleCodes: [...effective.platformRoleCodes],
      businessIds: [...effective.businessIds],
    };
  }
}
