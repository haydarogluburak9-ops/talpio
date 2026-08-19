import { Injectable, Logger } from '@nestjs/common';
import type { AuthSession, AuthTokens, CurrentUser } from '@talpio/types';

import { writeAudit } from '@common/audit/write-audit';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { RbacService } from '@modules/rbac/rbac.service';
import { CategoryFollowsService } from '@modules/social/category-follows.service';
import { ProfilesService } from '@modules/social/profiles.service';
import { toCurrentUser, userInclude, type UserRow } from '@modules/users/user.mapper';
import type { DevicePlatform, User } from '@/generated/prisma/client';
import { PlatformRoleCode, isMarketplaceRole, type UserRole } from '@talpio/types';
import { parseLoginIdentifier, type ParsedLoginIdentifier } from '@talpio/validation';
import { SocialProfileKind } from '@/generated/prisma/client';

import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { hashRefreshToken, TokenService } from './token.service';
import { VerificationService } from './verification.service';

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
    private readonly rbac: RbacService,
    private readonly categoryFollows: CategoryFollowsService,
    private readonly profiles: ProfilesService,
    private readonly verification: VerificationService,
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
    const username = dto.username.trim().toLowerCase();
    await this.profiles.assertUsernameAvailable(username);

    // Her hesap hem talep açar hem teklif verir; alıcı/satıcı ayrımı yoktur.
    const user = await this.prisma.user.create({
      data: {
        email,
        phone: dto.phone ?? null,
        passwordHash,
        fullName: dto.fullName,
        role: 'CUSTOMER',
        locale: dto.locale ?? this.config.defaultLocale,
        marketingConsentAt: dto.acceptedMarketing ? new Date() : null,
        customerProfile: { create: {} },
        providerProfile: { create: {} },
        socialProfile: {
          create: {
            kind: SocialProfileKind.PERSONAL,
            username,
            displayName: dto.fullName,
          },
        },
      },
      include: userInclude,
    });

    await this.rbac.assignPlatformRole(user.id, PlatformRoleCode.BUYER);
    await this.rbac.assignPlatformRole(user.id, PlatformRoleCode.SERVICE_PROVIDER);
    if (dto.interestCategoryIds?.length) {
      await this.categoryFollows.replaceForUser(user.id, dto.interestCategoryIds);
    }

    this.logger.log({ userId: user.id, role: user.role }, 'Yeni kullanıcı kaydı');
    void writeAudit(this.prisma, {
      actorId: user.id,
      action: 'auth.register',
      entityType: 'User',
      entityId: user.id,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    void this.verification.requestEmailVerification(user.id).catch((error: unknown) => {
      this.logger.warn({ error }, 'Kayıt sonrası e-posta doğrulama gönderilemedi');
    });

    return this.issueSession(user, device);
  }

  async login(dto: LoginDto, device: DeviceContext): Promise<AuthSession> {
    const parsed = parseLoginIdentifier(dto.identifier);
    const user = await this.findUserForLogin(parsed);

    // Kullanıcı yoksa da parola doğrulama maliyeti ödenir; aksi halde yanıt
    // süresi farkı hangi hesapların kayıtlı olduğunu ele verir.
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

    await this.ensureMarketplaceAccess(user.id, user.role as UserRole);
    const hydrated = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: userInclude,
    });

    const session = await this.issueSession(hydrated, device);
    void writeAudit(this.prisma, {
      actorId: user.id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    return session;
  }

  private async findUserForLogin(parsed: ParsedLoginIdentifier): Promise<UserRow | null> {
    if (parsed.kind === 'email') {
      return this.prisma.user.findUnique({
        where: { email: parsed.value },
        include: userInclude,
      });
    }

    if (parsed.kind === 'phone') {
      return this.prisma.user.findUnique({
        where: { phone: parsed.value },
        include: userInclude,
      });
    }

    const profile = await this.prisma.socialProfile.findFirst({
      where: { username: parsed.value, deletedAt: null },
      include: { user: { include: userInclude } },
    });

    return profile?.user ?? null;
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
    const hash = hashRefreshToken(refreshToken);
    const session = await this.prisma.userSession.findFirst({
      where: { refreshTokenHash: hash, revokedAt: null },
      select: { userId: true },
    });
    await this.prisma.userSession.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (session) {
      void writeAudit(this.prisma, {
        actorId: session.userId,
        action: 'auth.logout',
        entityType: 'User',
        entityId: session.userId,
      });
    }
  }

  /** Tüm cihazlardaki oturumları kapatır (parola değişimi, şüpheli erişim). */
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.prisma.deviceToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    void writeAudit(this.prisma, {
      actorId: userId,
      action: 'auth.logout_all',
      entityType: 'User',
      entityId: userId,
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

  /** Personel hariç her hesabın hem alıcı hem satıcı profili ve platform rolleri olur. */
  private async ensureMarketplaceAccess(userId: string, role: UserRole): Promise<void> {
    if (!isMarketplaceRole(role)) return;

    await this.prisma.customerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    await this.prisma.providerProfile.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    await this.rbac.assignPlatformRole(userId, PlatformRoleCode.BUYER);
    await this.rbac.assignPlatformRole(userId, PlatformRoleCode.SERVICE_PROVIDER);
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
    message: 'Giriş bilgisi veya şifre hatalı.',
  });
}

/**
 * Var olmayan kullanıcılar için doğrulanacak sahte özet. Gerçek bir Argon2id
 * çıktısıdır; parolası asla eşleşmez.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$8Fh5H1kZ0eQ3xM0j2vKQ0wKQnJ8Xz1YHvVQGJq0kXyA';
