import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';

import { NotificationOutbox } from './notification-outbox';
import type {
  EmailSender,
  EmailTarget,
  NotificationMessage,
  PushSender,
  PushTarget,
  SendResult,
  SmsSender,
  SmsTarget,
} from './notification-sender';
import { sendSmtpMail } from './smtp-client';

/**
 * FCM HTTP (legacy server key).
 * Anahtar yoksa gönderim düşer; platformun geri kalanı çalışmaya devam eder.
 */
@Injectable()
export class FirebasePushSender implements PushSender {
  readonly name = 'firebase';
  private readonly logger = new Logger(FirebasePushSender.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
  ) {}

  async send(target: PushTarget, message: NotificationMessage): Promise<SendResult> {
    const key = this.config.notifications.fcmServerKey;
    if (!key) {
      this.logger.warn('FCM_SERVER_KEY yok; push gönderilmedi.');
      return {
        delivered: false,
        failureReason: 'FCM sunucu anahtarı yapılandırılmadı.',
      };
    }

    if (target.tokens.length === 0) {
      return { delivered: false, failureReason: 'Kayıtlı cihaz jetonu yok.' };
    }

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registration_ids: target.tokens,
        notification: {
          title: 'Talpio',
          body: message.type,
        },
        data: {
          type: message.type,
          deepLink: message.deepLink ?? '',
          locale: message.locale,
          params: JSON.stringify(message.params ?? {}),
        },
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const ok = response.ok;
    for (const token of target.tokens) {
      this.outbox.record({
        channel: NotificationChannel.PUSH,
        target: token,
        type: message.type,
        params: message.params,
        deepLink: message.deepLink,
        locale: message.locale,
        sentAt: new Date().toISOString(),
      });
    }

    if (!ok) {
      const text = await response.text();
      this.logger.warn(`FCM HTTP ${response.status}: ${text.slice(0, 200)}`);
      return { delivered: false, failureReason: `FCM HTTP ${response.status}` };
    }

    return { delivered: true, failureReason: null };
  }
}

@Injectable()
export class SmtpEmailSender implements EmailSender {
  readonly name = 'smtp';
  private readonly logger = new Logger(SmtpEmailSender.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
  ) {}

  async send(target: EmailTarget, message: NotificationMessage): Promise<SendResult> {
    const host = this.config.notifications.smtpHost;
    if (!host) {
      return {
        delivered: false,
        failureReason: 'SMTP_HOST yapılandırılmadı.',
      };
    }

    try {
      await sendSmtpMail({
        host,
        port: this.config.notifications.smtpPort,
        secure: this.config.notifications.smtpSecure,
        user: this.config.notifications.smtpUser,
        pass: this.config.notifications.smtpPass,
        from: this.config.notifications.mailFrom,
        to: target.email,
        subject: `Talpio · ${message.type}`,
        text: [
          `Merhaba${target.name ? ` ${target.name}` : ''},`,
          `Bildirim: ${message.type}`,
          message.deepLink ? `Bağlantı: ${message.deepLink}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'SMTP gönderimi başarısız.';
      this.logger.warn(reason);
      return { delivered: false, failureReason: reason };
    }

    this.outbox.record({
      channel: NotificationChannel.EMAIL,
      target: target.email,
      type: message.type,
      params: message.params,
      deepLink: message.deepLink,
      locale: message.locale,
      sentAt: new Date().toISOString(),
    });

    return { delivered: true, failureReason: null };
  }
}

function smsBody(message: NotificationMessage): string {
  const code =
    message.params && 'ticketSubject' in message.params
      ? String(message.params.ticketSubject)
      : message.type;
  return `Talpio: ${code}`;
}

@Injectable()
export class TwilioSmsSender implements SmsSender {
  readonly name = 'twilio';
  private readonly logger = new Logger(TwilioSmsSender.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
  ) {}

  async send(target: SmsTarget, message: NotificationMessage): Promise<SendResult> {
    const sid = this.config.notifications.twilioAccountSid;
    const token = this.config.notifications.twilioAuthToken;
    const from = this.config.notifications.twilioFrom;
    if (!sid || !token || !from) {
      return { delivered: false, failureReason: 'Twilio kimlik bilgileri eksik.' };
    }

    const body = new URLSearchParams({
      To: target.phone,
      From: from,
      Body: smsBody(message),
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    this.outbox.record({
      channel: NotificationChannel.SMS,
      target: target.phone,
      type: message.type,
      params: message.params,
      deepLink: message.deepLink,
      locale: message.locale,
      sentAt: new Date().toISOString(),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.warn(`Twilio HTTP ${response.status}: ${text.slice(0, 200)}`);
      return { delivered: false, failureReason: `Twilio HTTP ${response.status}` };
    }
    return { delivered: true, failureReason: null };
  }
}

@Injectable()
export class NetgsmSmsSender implements SmsSender {
  readonly name = 'netgsm';
  private readonly logger = new Logger(NetgsmSmsSender.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
  ) {}

  async send(target: SmsTarget, message: NotificationMessage): Promise<SendResult> {
    const usercode = this.config.notifications.netgsmUser;
    const password = this.config.notifications.netgsmPass;
    const header = this.config.notifications.netgsmHeader ?? this.config.notifications.smsSender;
    if (!usercode || !password) {
      return { delivered: false, failureReason: 'Netgsm kimlik bilgileri eksik.' };
    }

    const params = new URLSearchParams({
      usercode,
      password,
      gsmno: target.phone.replace(/^\+/, ''),
      message: smsBody(message),
      msgheader: header,
    });
    const response = await fetch(`https://api.netgsm.com.tr/sms/send/get?${params.toString()}`, {
      signal: AbortSignal.timeout(15_000),
    });

    this.outbox.record({
      channel: NotificationChannel.SMS,
      target: target.phone,
      type: message.type,
      params: message.params,
      deepLink: message.deepLink,
      locale: message.locale,
      sentAt: new Date().toISOString(),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.warn(`Netgsm HTTP ${response.status}: ${text.slice(0, 200)}`);
      return { delivered: false, failureReason: `Netgsm HTTP ${response.status}` };
    }
    return { delivered: true, failureReason: null };
  }
}
