import { Injectable, Logger } from '@nestjs/common';
import type { AuthSession, AuthTokens, CurrentUser } from '@ustapilot/types';

import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { toCurrentUser, userInclude, type UserRow } from '@modules/users/user.mapper';
import type { DevicePlatform, User } from '@/generated/prisma/client';

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { hashRefreshToken, TokenService } from './token.service';

/** Oturumu açan cihaz hakkında istekten türetilen bilgi. */
export interface DeviceContext {
  platform: DevicePlatform;
  deviceId?: string | undefined;
  deviceName?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto, device: DeviceContext): Promise<AuthSession> {
    const email = normalizeEmail(dto.email);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
      select: { id: true, email: true },
    });

    if (existing) {
      throw new AppException(
        existing.email === email ? 'EMAIL_ALREADY_EXISTS' : 'PHONE_ALREADY_EXISTS',
        {
          message:
            existing.email === email
              ? 'Bu e-posta adresi zaten kayıtlı.'
              : 'Bu telefon numarası zaten kayıtlı.',
        },
      );
    }

    const passwordHash = await this.passwords.hash(dto.password);

    // Profil kaydı kullanıcıyla aynı işlemde açılır; yarım kalmış hesap oluşmaz.
    const user = await this.prisma.user.create({
      data: {
        email,
        phone: dto.phone ?? null,
        passwordHash,
        fullName: dto.fullName,
        role: dto.role,
        locale: dto.locale ?? this.config.defaultLocale,
        ...(dto.role === 'PROVIDER'
          ? { providerProfile: { create: {} } }
          : { customerProfile: { create: {} } }),
      },
      include: userInclude,
    });

    this.logger.log({ userId: user.id, role: user.role }, 'Yeni kullanıcı kaydı');

    return this.issueSession(user, device);
  }

  async login(dto: LoginDto, device: DeviceContext): Promise<AuthSession> {
    const email = normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: userInclude,
    });

    // Kullanıcı yoksa da parola doğrulama maliyeti ödenir; aksi halde yanıt
    // süresi farkı hangi e-postaların kayıtlı olduğunu ele verir.
    if (!user || !user.passwordHash) {
      await this.passwords.verify(DUMMY_HASH, dto.password);
      throw invalidCredentials();
    }

    if (user.deletedAt) throw invalidCredentials();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppException('ACCOUNT_LOCKED', {
        message: 'Çok fazla hatalı deneme yapıldı. Hesabınız geçici olarak kilitlendi.',
        context: { userId: user.id, lockedUntil: user.lockedUntil },
      });
    }

    const matches = await this.passwords.verify(user.passwordHash, dto.password);

    if (!matches) {
      await this.registerFailedAttempt(user);
      throw invalidCredentials();
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new AppException('ACCOUNT_SUSPENDED', {
        message: 'Hesabınız askıya alınmış. Destek ekibiyle iletişime geçin.',
        context: { userId: user.id, status: user.status },
      });
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }

    return this.issueSession(user, device);
  }

  /**
   * Yenileme jetonu tek kullanımlıktır (rotation). Kullanılan oturum iptal
   * edilip yerine yenisi açılır; çalınan bir jetonun tekrar kullanımı da bu
   * sayede fark edilir.
   */
  async refresh(refreshToken: string, device: DeviceContext): Promise<AuthSession> {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash: hashRefreshToken(refreshToken) },
      include: { user: { include: userInclude } },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppException('REFRESH_TOKEN_INVALID', {
        message: 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
      });
    }

    if (session.user.deletedAt || session.user.status === 'BANNED') {
      throw new AppException('REFRESH_TOKEN_INVALID', { message: 'Oturumunuz sona erdi.' });
    }

    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(session.user, device);
  }

  async logout(refreshToken: string): Promise<void> {
    // Bilinmeyen jeton için de başarı döner; jeton varlığı sızdırılmaz.
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Tüm cihazlardaki oturumları kapatır (parola değişimi, şüpheli erişim). */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async currentUser(userId: string): Promise<CurrentUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: userInclude,
    });

    if (!user) throw AppException.notFound('Kullanıcı', userId);

    return toCurrentUser(user, this.config.fileBaseUrl);
  }

  private async issueSession(user: UserRow, device: DeviceContext): Promise<AuthSession> {
    const { token: refreshToken, hash } = this.tokens.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.tokens.refreshTokenTtlSeconds * 1000);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: hash,
        platform: device.platform,
        deviceId: device.deviceId ?? null,
        deviceName: device.deviceName ?? null,
        ipAddress: device.ipAddress ?? null,
        userAgent: device.userAgent ?? null,
        expiresAt,
        lastUsedAt: new Date(),
      },
      select: { id: true },
    });

    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      role: user.role,
      sid: session.id,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresIn: this.tokens.accessTokenTtlSeconds,
    };

    return { user: toCurrentUser(user, this.config.fileBaseUrl), tokens };
  }

  private async registerFailedAttempt(user: User): Promise<void> {
    const attempts = user.failedLoginCount + 1;
    const maxAttempts = this.config.get('MAX_LOGIN_ATTEMPTS');

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: attempts,
        lockedUntil:
          attempts >= maxAttempts
            ? new Date(Date.now() + this.config.get('LOGIN_LOCKOUT_MINUTES') * 60_000)
            : null,
      },
    });
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function invalidCredentials(): AppException {
  // Hangi alanın hatalı olduğu belirtilmez; hesap sayımını zorlaştırır.
  return new AppException('INVALID_CREDENTIALS', {
    message: 'E-posta veya şifre hatalı.',
  });
}

/**
 * Var olmayan kullanıcılar için doğrulanacak sahte özet. Gerçek bir Argon2id
 * çıktısıdır; parolası asla eşleşmez.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$8Fh5H1kZ0eQ3xM0j2vKQ0wKQnJ8Xz1YHvVQGJq0kXyA';
