import { Injectable, Logger } from '@nestjs/common';
import { renderNotification } from '@talpio/localization';
import { NotificationChannel, NotificationType } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';

import { NotificationOutbox } from './notification-outbox';
import type {
  EmailSender,
  EmailTarget,
  NotificationMessage,
  SendResult,
  SmsSender,
  SmsTarget,
  TransactionalMessage,
} from './notification-sender';
import { sendSmtpMail } from './smtp-client';

/*
 * Push sürücüsü için `expo-push.sender.ts` dosyasına bakın.
 *
 * Buradaki eski `FirebasePushSender`, FCM'in `fcm.googleapis.com/fcm/send`
 * ucunu ve `Authorization: key=...` başlığını kullanıyordu. Google bu API'yi
 * 2024'te tamamen kapattı, dolayısıyla adaptör ölü koddu. Mobil uygulama zaten
 * Expo jetonu kaydettiği için yerine Expo Push API sürücüsü yazıldı.
 */

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

    // Konu ve gövde alıcının diliyle çözülür; ham tür adı ("OFFER_RECEIVED")
    // kullanıcının gelen kutusunda görünmemelidir.
    const { title, body } = renderNotification(message.type, message.params, message.locale);

    try {
      await sendSmtpMail({
        host,
        port: this.config.notifications.smtpPort,
        secure: this.config.notifications.smtpSecure,
        user: this.config.notifications.smtpUser,
        pass: this.config.notifications.smtpPass,
        from: this.config.notifications.mailFrom,
        to: target.email,
        subject: `Talpio · ${title}`,
        text: [
          `Merhaba${target.name ? ` ${target.name}` : ''},`,
          body,
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

  async sendTransactional(target: EmailTarget, message: TransactionalMessage): Promise<SendResult> {
    const host = this.config.notifications.smtpHost;
    if (!host) return { delivered: false, failureReason: 'SMTP_HOST yapılandırılmadı.' };

    try {
      await sendSmtpMail({
        host,
        port: this.config.notifications.smtpPort,
        secure: this.config.notifications.smtpSecure,
        user: this.config.notifications.smtpUser,
        pass: this.config.notifications.smtpPass,
        from: this.config.notifications.mailFrom,
        to: target.email,
        subject: message.subject,
        text: message.text,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'SMTP gönderimi başarısız.';
      this.logger.warn(reason);
      return { delivered: false, failureReason: reason };
    }

    recordTransactional(this.outbox, target, message);
    return { delivered: true, failureReason: null };
  }
}

/**
 * Kimlik e-postasını tampona yazar.
 *
 * Gövde jeton taşıyan bağlantı içerdiği için tampona yalnızca konu geçer:
 * duman testinin doğrulaması gereken şey gönderimin yapıldığı, sırrın kendisi
 * değil.
 */
function recordTransactional(
  outbox: NotificationOutbox,
  target: EmailTarget,
  message: TransactionalMessage,
): void {
  outbox.record({
    channel: NotificationChannel.EMAIL,
    target: target.email,
    type: NotificationType.SUPPORT_REPLY,
    params: { ticketSubject: message.subject },
    deepLink: null,
    locale: message.locale,
    sentAt: new Date().toISOString(),
  });
}

/**
 * Resend HTTP API sürücüsü.
 *
 * SDK yerine doğrudan `fetch` kullanılır: tek uç nokta çağrılıyor ve depodaki
 * diğer sağlayıcılar (Twilio, Netgsm, Expo) da aynı şekilde bağlanmış durumda.
 */
@Injectable()
export class ResendEmailSender implements EmailSender {
  readonly name = 'resend';
  private readonly logger = new Logger(ResendEmailSender.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly outbox: NotificationOutbox,
  ) {}

  async send(target: EmailTarget, message: NotificationMessage): Promise<SendResult> {
    const { title, body } = renderNotification(message.type, message.params, message.locale);
    const result = await this.deliver(
      target.email,
      `Talpio · ${title}`,
      [
        `Merhaba${target.name ? ` ${target.name}` : ''},`,
        body,
        message.deepLink ? `Bağlantı: ${message.deepLink}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    );

    if (!result.delivered) return result;

    this.outbox.record({
      channel: NotificationChannel.EMAIL,
      target: target.email,
      type: message.type,
      params: message.params,
      deepLink: message.deepLink,
      locale: message.locale,
      sentAt: new Date().toISOString(),
    });

    return result;
  }

  async sendTransactional(target: EmailTarget, message: TransactionalMessage): Promise<SendResult> {
    const result = await this.deliver(target.email, message.subject, message.text);
    if (!result.delivered) return result;

    recordTransactional(this.outbox, target, message);
    return result;
  }

  private async deliver(to: string, subject: string, text: string): Promise<SendResult> {
    const apiKey = this.config.notifications.resendApiKey;
    if (!apiKey) return { delivered: false, failureReason: 'RESEND_API_KEY yapılandırılmadı.' };

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.config.notifications.mailFrom,
          to: [to],
          subject,
          text,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        // Yanıt gövdesi alıcı adresini içerebilir; yalnızca kısa bir kesit alınır.
        const detail = (await response.text()).slice(0, 200);
        this.logger.warn(`Resend HTTP ${response.status}: ${detail}`);
        return { delivered: false, failureReason: `Resend HTTP ${response.status}` };
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Resend gönderimi başarısız.';
      this.logger.warn(reason);
      return { delivered: false, failureReason: reason };
    }

    return { delivered: true, failureReason: null };
  }
}

function smsBody(message: NotificationMessage): string {
  // Parametre değeri sözlük de olabilir; SMS'e yalnızca düz metin girer.
  const subject = message.params?.ticketSubject;
  const code = typeof subject === 'string' ? subject : message.type;
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
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(15_000),
      },
    );

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
