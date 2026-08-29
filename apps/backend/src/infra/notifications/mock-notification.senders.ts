import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@talpio/types';

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
  TransactionalMessage,
} from './notification-sender';

/**
 * Geliştirme sürücüleri.
 *
 * Ağa çıkmaz; gönderimi günlüğe yazar ve tampona kaydeder. Metni çözmezler:
 * hazır cümle sunucuda tutulmadığı için kayıtta tür ve parametreler durur,
 * cümleyi istemci kendi dilinde üretir.
 */
@Injectable()
export class MockPushSender implements PushSender {
  readonly name = 'mock';

  private readonly logger = new Logger(MockPushSender.name);

  constructor(private readonly outbox: NotificationOutbox) {}

  send(target: PushTarget, message: NotificationMessage): Promise<SendResult> {
    if (target.tokens.length === 0) {
      // Cihaz kaydı olmayan kullanıcı için gönderim hata değildir.
      return Promise.resolve({ delivered: false, failureReason: 'Kayıtlı cihaz jetonu yok.' });
    }

    for (const token of target.tokens) {
      this.outbox.record(entry(NotificationChannel.PUSH, token, message));
    }

    this.logger.debug(
      `Push gönderildi: ${message.type} → ${target.tokens.length} cihaz (${message.locale})`,
    );

    return Promise.resolve({ delivered: true, failureReason: null });
  }
}

@Injectable()
export class MockEmailSender implements EmailSender {
  readonly name = 'mock';

  private readonly logger = new Logger(MockEmailSender.name);

  constructor(
    private readonly outbox: NotificationOutbox,
    private readonly config: AppConfigService,
  ) {}

  send(target: EmailTarget, message: NotificationMessage): Promise<SendResult> {
    this.outbox.record(entry(NotificationChannel.EMAIL, target.email, message));

    this.logger.debug(
      `E-posta gönderildi: ${message.type} → ${target.email} (${this.config.notifications.mailFrom})`,
    );

    return Promise.resolve({ delivered: true, failureReason: null });
  }

  sendTransactional(target: EmailTarget, message: TransactionalMessage): Promise<SendResult> {
    // Gövde jeton taşıyan bağlantı içerir; günlüğe yalnızca konu yazılır.
    this.logger.log(
      `Kimlik e-postası (mock): ${message.subject} → ${target.email} (${message.locale})`,
    );

    this.outbox.record({
      channel: NotificationChannel.EMAIL,
      target: target.email,
      type: NotificationType.SUPPORT_REPLY,
      params: { ticketSubject: message.subject },
      deepLink: null,
      locale: message.locale,
      sentAt: new Date().toISOString(),
    });

    return Promise.resolve({ delivered: true, failureReason: null });
  }
}

@Injectable()
export class MockSmsSender implements SmsSender {
  readonly name = 'mock';

  private readonly logger = new Logger(MockSmsSender.name);

  constructor(
    private readonly outbox: NotificationOutbox,
    private readonly config: AppConfigService,
  ) {}

  send(target: SmsTarget, message: NotificationMessage): Promise<SendResult> {
    this.outbox.record(entry(NotificationChannel.SMS, target.phone, message));

    this.logger.debug(
      `SMS gönderildi: ${message.type} → ${target.phone} (${this.config.notifications.smsSender})`,
    );

    return Promise.resolve({ delivered: true, failureReason: null });
  }
}

function entry(channel: NotificationChannel, target: string, message: NotificationMessage) {
  return {
    channel,
    target,
    type: message.type,
    params: message.params,
    deepLink: message.deepLink,
    locale: message.locale,
    sentAt: new Date().toISOString(),
  };
}
