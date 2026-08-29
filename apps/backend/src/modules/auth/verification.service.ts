import { createHash, randomBytes, randomInt } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { createTranslator } from '@talpio/localization';
import { NotificationType } from '@talpio/types';

import { writeAudit } from '@common/audit/write-audit';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import {
  EMAIL_SENDER,
  SMS_SENDER,
  type EmailSender,
  type SmsSender,
} from '@infra/notifications/notification-sender';
import { PrismaService } from '@infra/prisma/prisma.service';

import { PasswordService } from './password.service';

const EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly passwords: PasswordService,
    @Inject(EMAIL_SENDER) private readonly email: EmailSender,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
  ) {}

  async requestEmailVerification(userId: string): Promise<{ sent: true }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true, locale: true, fullName: true },
    });
    if (!user) throw AppException.notFound('Kullanıcı', userId);

    const { token, hash } = opaqueToken();
    await this.replaceToken(user.id, 'EMAIL_VERIFICATION', hash, EMAIL_TTL_MS);
    const link = `${this.webAppUrl()}/dogrula-eposta?token=${encodeURIComponent(token)}`;
    await this.sendAuthMail(user.email, user.fullName, user.locale, 'verify', link, 24);
    return { sent: true };
  }

  async verifyEmail(token: string): Promise<{ verified: true }> {
    const row = await this.consumeToken(token, 'EMAIL_VERIFICATION');
    const user = await this.prisma.user.findUnique({
      where: { id: row.userId },
      select: { status: true },
    });

    // Yalnızca doğrulama bekleyen hesap aktifleşir. Koşulsuz `ACTIVE` yazmak,
    // askıya alınmış bir kullanıcının yasaktan önce aldığı jetonu kullanarak
    // hesabını kendi kendine geri açmasına izin veriyordu.
    await this.prisma.user.update({
      where: { id: row.userId },
      data: {
        emailVerifiedAt: new Date(),
        ...(user?.status === 'PENDING_VERIFICATION' ? { status: 'ACTIVE' as const } : {}),
      },
    });
    return { verified: true };
  }

  async requestPhoneCode(userId: string, phone: string): Promise<{ sent: true }> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, locale: true },
    });
    if (!user) throw AppException.notFound('Kullanıcı', userId);

    const taken = await this.prisma.user.findFirst({
      where: { phone, deletedAt: null, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) {
      throw new AppException('PHONE_ALREADY_EXISTS', {
        message: 'Bu telefon numarası başka bir hesapta kayıtlı.',
      });
    }

    const length = this.config.get('OTP_LENGTH');
    const code = String(randomInt(0, 10 ** length)).padStart(length, '0');
    const ttlMin = this.config.get('OTP_TTL_MINUTES');
    await this.replaceToken(user.id, 'PHONE_VERIFICATION', hashToken(code), ttlMin * 60_000);
    await this.prisma.user.update({ where: { id: user.id }, data: { phone } });

    await this.sms.send(
      { phone },
      {
        type: NotificationType.SUPPORT_REPLY,
        params: { ticketSubject: code },
        deepLink: null,
        locale: user.locale,
      },
    );
    this.logger.log({ userId, phone }, 'Telefon doğrulama kodu üretildi');
    return { sent: true };
  }

  async verifyPhone(userId: string, phone: string, code: string): Promise<{ verified: true }> {
    const row = await this.consumeToken(code, 'PHONE_VERIFICATION', userId);
    const user = await this.prisma.user.findFirst({
      where: { id: row.userId, phone, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new AppException('TOKEN_INVALID', { message: 'Doğrulama kodu geçersiz.' });
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date() },
    });
    return { verified: true };
  }

  async forgotPassword(email: string): Promise<{ sent: true }> {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: { id: true, email: true, locale: true, fullName: true },
    });
    if (user) {
      const { token, hash } = opaqueToken();
      await this.replaceToken(user.id, 'PASSWORD_RESET', hash, RESET_TTL_MS);
      const link = `${this.webAppUrl()}/sifre-sifirla?token=${encodeURIComponent(token)}`;
      await this.sendAuthMail(user.email, user.fullName, user.locale, 'reset', link, 1);
    }
    return { sent: true };
  }

  async resetPassword(token: string, password: string): Promise<{ reset: true }> {
    const row = await this.consumeToken(token, 'PASSWORD_RESET');
    const passwordHash = await this.passwords.hash(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, failedLoginCount: 0, lockedUntil: null },
      }),
      this.prisma.userSession.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    void writeAudit(this.prisma, {
      actorId: row.userId,
      action: 'auth.password_reset',
      entityType: 'User',
      entityId: row.userId,
    });
    return { reset: true };
  }

  private webAppUrl(): string {
    return this.config.get('WEB_APP_URL');
  }

  private async replaceToken(
    userId: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION',
    tokenHash: string,
    ttlMs: number,
  ): Promise<void> {
    await this.prisma.verificationToken.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.verificationToken.create({
      data: {
        userId,
        purpose,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
  }

  private async consumeToken(
    raw: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION',
    userId?: string,
  ) {
    const row = await this.prisma.verificationToken.findFirst({
      where: {
        tokenHash: hashToken(raw),
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
        ...(userId ? { userId } : {}),
      },
    });
    if (!row) {
      throw new AppException('TOKEN_INVALID', {
        message: 'Bağlantı veya kod geçersiz / süresi dolmuş.',
      });
    }
    await this.prisma.verificationToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date(), attempts: { increment: 1 } },
    });
    return row;
  }

  /**
   * Kimlik e-postasını seçili sürücüden gönderir.
   *
   * Metin alıcının diliyle çözülür; sürücü (Resend, SMTP veya mock) gövdeyi
   * olduğu gibi iletir. Gönderim başarısızsa çağıran taraf hata alır: aksi
   * halde kullanıcı bağlantının gittiğini sanır ve bekler.
   */
  private async sendAuthMail(
    email: string,
    name: string,
    locale: string,
    kind: 'verify' | 'reset',
    link: string,
    hours: number,
  ): Promise<void> {
    const t = createTranslator(locale);
    const greeting = t.t('authEmail.greeting', { name: name.trim() || 'Talpio' });
    const subject = t.t(kind === 'verify' ? 'authEmail.verifySubject' : 'authEmail.resetSubject');
    const body = t.t(kind === 'verify' ? 'authEmail.verifyBody' : 'authEmail.resetBody', {
      link,
      hours,
    });

    const result = await this.email.sendTransactional(
      { email, name },
      { subject, text: `${greeting}\n\n${body}`, locale },
    );

    if (!result.delivered) {
      this.logger.warn(`Kimlik e-postası gönderilemedi: ${result.failureReason ?? 'bilinmeyen'}`);
      throw new AppException('SERVICE_UNAVAILABLE', {
        message: 'E-posta şu anda gönderilemiyor. Lütfen biraz sonra tekrar deneyin.',
      });
    }
  }
}

function opaqueToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
