import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';

/** Erişim jetonunun taşıdığı iddialar. Hassas veri konmaz. */
export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  /** Oturum kimliği; jeton iptali için gerekir. */
  sid: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      // Ömür ortam değişkeninden gelir; jsonwebtoken tipleri yalnızca sabit
      // birim dizilerini kabul ettiği için saniyeye çevrilir.
      expiresIn: this.accessTokenTtlSeconds,
    });
  }

  verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwt.verifyAsync<AccessTokenPayload>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Yenileme jetonu JWT değil, rastgele opak bir dizidir. Veritabanında yalnızca
   * SHA-256 özeti saklanır; veritabanı sızsa bile jetonlar kullanılamaz.
   */
  generateRefreshToken(): { token: string; hash: string } {
    const token = randomBytes(48).toString('base64url');
    return { token, hash: hashRefreshToken(token) };
  }

  /** Erişim jetonunun saniye cinsinden ömrü; istemci yenileme zamanını buna göre planlar. */
  get accessTokenTtlSeconds(): number {
    return parseDuration(this.config.get('JWT_ACCESS_EXPIRES_IN'));
  }

  get refreshTokenTtlSeconds(): number {
    return parseDuration(this.config.get('JWT_REFRESH_EXPIRES_IN'));
  }
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

const DURATION_UNITS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86_400 };

/** "15m", "30d" gibi kısa süre ifadelerini saniyeye çevirir. */
export function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) throw new Error(`Geçersiz süre biçimi: ${value}`);

  const amount = Number(match[1]);
  const unit = DURATION_UNITS[match[2] as string];
  if (unit === undefined) throw new Error(`Geçersiz süre birimi: ${value}`);

  return amount * unit;
}
