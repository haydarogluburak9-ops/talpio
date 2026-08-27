import { createHash, randomBytes, randomInt } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@talpio/types';

import { writeAudit } from '@common/audit/write-audit';
import { AppException } from '@common/errors/app.exception';
import { AppConfigService } from '@config/app-config.service';
import { NotificationOutbox } from '@infra/notifications/notification-outbox';
import { SMS_SENDER, type SmsSender } from '@infra/notifications/notification-sender';
import { sendSmtpMail } from '@infra/notifications/smtp-client';
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
    private readonly outbox: NotificationOutbox,
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
    await this.sendMail(
      user.email,
      user.fullName,
      user.locale,
      'Verify your Talpio email',
      `Confirm your email: ${link}`,
      link,
    );
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
      await this.sendMail(
        user.email,
        user.fullName,
        user.locale,
        'Reset your Talpio password',
        `Reset your password: ${link}`,
        link,
      );
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

  private async sendMail(
    email: string,
    name: string,
    locale: string,
    subject: string,
    text: string,
    link: string,
  ): Promise<void> {
    const smtp = this.config.notifications;
    if (smtp.mailDriver === 'smtp' && smtp.smtpHost) {
      await sendSmtpMail({
        host: smtp.smtpHost,
        port: smtp.smtpPort,
        secure: smtp.smtpSecure,
        user: smtp.smtpUser,
        pass: smtp.smtpPass,
        from: smtp.mailFrom,
        to: email,
        subject,
        text,
      });
    } else {
      this.logger.log({ email, subject, link }, 'Auth e-postası (mock)');
    }

    // Tampona jeton taşıyan bağlantı yazılmaz. Duman testinin doğrulaması
    // gereken şey gönderimin yapıldığı; sırrın kendisi değil.
    this.outbox.record({
      channel: NotificationChannel.EMAIL,
      target: email,
      type: NotificationType.SUPPORT_REPLY,
      params: { ticketSubject: subject },
      deepLink: null,
      locale,
      sentAt: new Date().toISOString(),
    });
    void name;
    void link;
  }
}

function opaqueToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
