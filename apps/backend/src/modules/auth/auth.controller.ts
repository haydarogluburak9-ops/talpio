import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthSession, CurrentUser } from '@talpio/types';
import type { Request, Response } from 'express';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import type { DevicePlatform } from '@/generated/prisma/client';

import { AuthService, type DeviceContext } from './auth.service';
import { CurrentUser as CurrentUserParam } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ForgotPasswordDto,
  RequestPhoneCodeDto,
  ResetPasswordDto,
  VerifyEmailDto,
  VerifyPhoneDto,
} from './dto/verification.dto';
import type { AuthenticatedUser } from './jwt.strategy';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';

const REFRESH_COOKIE = 'talpio_refresh';
const ACCESS_COOKIE = 'talpio_access';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
    private readonly verification: VerificationService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Yeni müşteri veya satıcı hesabı oluşturur' })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const session = await this.auth.register(dto, deviceContextFrom(request));
    this.applySessionCookies(request, response, session);
    return session;
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'E-posta ve şifre ile oturum açar' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const session = await this.auth.login(dto, deviceContextFrom(request, dto));
    this.applySessionCookies(request, response, session);
    return session;
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Yenileme jetonuyla yeni erişim jetonu üretir' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSession> {
    const token = readRefreshToken(request, dto);
    const session = await this.auth.refresh(token, deviceContextFrom(request));
    this.applySessionCookies(request, response, session);
    return session;
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bulunulan cihazdaki oturumu kapatır' })
  async logout(
    @Body() dto: RefreshDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    const token = readRefreshTokenOrNull(request, dto);
    if (token) await this.auth.logout(token);

    this.clearSessionCookies(response);
    return { success: true };
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcının tüm cihazlardaki oturumlarını kapatır' })
  async logoutAll(
    @CurrentUserParam() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ success: true }> {
    await this.auth.logoutAll(user.id);
    this.clearSessionCookies(response);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Oturum açmış kullanıcının profilini döner' })
  @ApiOkResponse({ description: 'Kullanıcı bilgisi ve rol izinleri' })
  me(@CurrentUserParam() user: AuthenticatedUser): Promise<CurrentUser> {
    return this.auth.currentUser(user.id);
  }

  @Post('verify-email/request')
  @HttpCode(200)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'E-posta doğrulama bağlantısı gönderir' })
  requestEmailVerification(@CurrentUserParam() user: AuthenticatedUser) {
    return this.verification.requestEmailVerification(user.id);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'E-posta doğrulama jetonunu tüketir' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verification.verifyEmail(dto.token);
  }

  @Post('phone/request-code')
  @HttpCode(200)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Telefon OTP kodu gönderir' })
  requestPhoneCode(@CurrentUserParam() user: AuthenticatedUser, @Body() dto: RequestPhoneCodeDto) {
    return this.verification.requestPhoneCode(user.id, dto.phone);
  }

  @Post('phone/verify')
  @HttpCode(200)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Telefon OTP kodunu doğrular' })
  verifyPhone(@CurrentUserParam() user: AuthenticatedUser, @Body() dto: VerifyPhoneDto) {
    return this.verification.verifyPhone(user.id, dto.phone, dto.code);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Şifre sıfırlama bağlantısı gönderir' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.verification.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Şifre sıfırlama jetonunu tüketir' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.verification.resetPassword(dto.token, dto.password);
  }

  @Post('change-password')
  @HttpCode(200)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Oturum açmış kullanıcının kendi şifresini değiştirir' })
  changePassword(@CurrentUserParam() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, user.sessionId, dto.currentPassword, dto.password);
  }

  /**
   * Tarayıcı istemcileri için her iki jeton da HTTP-only çerezde taşınır; XSS
   * durumunda JavaScript erişemez. Mobil istemciler çerez kullanmaz, jetonu
   * gövdeden alıp güvenli depolamaya yazar.
   *
   * Erişim çerezi tüm API'ye, yenileme çerezi yalnızca kimlik uçlarına gider:
   * yenileme jetonu her istekte ağa çıkarsa sızma yüzeyi gereksiz büyür.
   */
  private applySessionCookies(request: Request, response: Response, session: AuthSession): void {
    if (!isBrowserClient(request)) return;

    response.cookie(ACCESS_COOKIE, session.tokens.accessToken, {
      ...this.cookieOptions(),
      path: `/${this.config.apiPrefix}`,
      maxAge: this.tokens.accessTokenTtlSeconds * 1000,
    });

    response.cookie(REFRESH_COOKIE, session.tokens.refreshToken, {
      ...this.cookieOptions(),
      maxAge: this.tokens.refreshTokenTtlSeconds * 1000,
    });
  }

  private clearSessionCookies(response: Response): void {
    response.clearCookie(ACCESS_COOKIE, {
      ...this.cookieOptions(),
      path: `/${this.config.apiPrefix}`,
    });
    response.clearCookie(REFRESH_COOKIE, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      // Yayındaki her ortam HTTPS üzerinden sunulur. Bayrak yalnızca
      // `production`'a bağlanırsa `staging`'de oturum çerezi düz HTTP ile de
      // gönderilir ve ağdaki biri oturumu ele geçirebilir.
      secure: this.config.isDeployed,
      sameSite: 'lax' as const,
      // Yenileme çerezi yalnızca kimlik uçlarına gönderilir.
      path: `/${this.config.apiPrefix}/auth`,
    };
  }
}

/**
 * İstemci türü `X-Client-Platform` başlığından okunur. Başlık yoksa tarayıcı
 * varsayılır: çerez göndermek mobilde zararsız, tersi ise web'de oturumu bozar.
 */
function isBrowserClient(request: Request): boolean {
  const platform = clientPlatform(request);
  return platform === 'WEB';
}

function clientPlatform(request: Request): DevicePlatform {
  const header = String(request.header('x-client-platform') ?? '').toUpperCase();
  if (header === 'IOS' || header === 'ANDROID' || header === 'WEB') return header;
  return 'WEB';
}

function deviceContextFrom(
  request: Request,
  dto?: { deviceId?: string; deviceName?: string },
): DeviceContext {
  return {
    platform: clientPlatform(request),
    deviceId: dto?.deviceId ?? request.header('x-device-id') ?? undefined,
    deviceName: dto?.deviceName ?? request.header('x-device-name') ?? undefined,
    ipAddress: request.ip,
    // Uzun user-agent dizileri log ve sütun sınırlarını zorlamasın.
    userAgent: request.header('user-agent')?.slice(0, 500),
  };
}

function readRefreshToken(request: Request, dto: RefreshDto): string {
  const token = readRefreshTokenOrNull(request, dto);

  if (!token) {
    throw new AppException('REFRESH_TOKEN_INVALID', {
      message: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
    });
  }

  return token;
}

function readRefreshTokenOrNull(request: Request, dto: RefreshDto): string | null {
  if (dto.refreshToken) return dto.refreshToken;

  const cookies: unknown = (request as { cookies?: unknown }).cookies;
  if (typeof cookies !== 'object' || cookies === null) return null;

  const value = (cookies as Record<string, unknown>)[REFRESH_COOKIE];
  return typeof value === 'string' ? value : null;
}
