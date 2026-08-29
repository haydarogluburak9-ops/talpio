import { Global, Logger, Module } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';

import { ExpoPushSender } from './expo-push.sender';
import { MockEmailSender, MockPushSender, MockSmsSender } from './mock-notification.senders';
import { NotificationOutbox } from './notification-outbox';
import {
  EMAIL_SENDER,
  PUSH_SENDER,
  SMS_SENDER,
  type EmailSender,
  type PushSender,
  type SmsSender,
} from './notification-sender';
import {
  NetgsmSmsSender,
  ResendEmailSender,
  SmtpEmailSender,
  TwilioSmsSender,
} from './production-notification.senders';

/**
 * Kanal sürücülerini ortam değişkeninden seçer.
 *
 * Yeni bir sağlayıcı eklemek, arayüzü uygulayan adaptörü yazıp buradaki
 * eşlemeye bir satır eklemekten ibarettir.
 *
 * Mock sürücü canlıda yasak değil (SMS hariç, orası şemada engelli): push ve
 * e-posta düşse kimse para kaybetmez, veri bozulmaz — yalnızca haber gitmez.
 * Bu yüzden süreç durdurulmaz, açılışta uyarı yazılır.
 */
function warnIfMock(logger: Logger, channel: string, driver: string): void {
  if (driver === 'mock') {
    logger.warn(`${channel} kanalı mock sürücüyle çalışıyor; gönderim yalnızca günlüğe yazılır.`);
  }
}

function selectPushSender(
  config: AppConfigService,
  mock: MockPushSender,
  expo: ExpoPushSender,
): PushSender {
  const driver = config.notifications.pushDriver;
  warnIfMock(new Logger('NotificationSenderModule'), 'Push', driver);

  if (driver === 'mock') return mock;
  if (driver === 'expo') return expo;

  // Tüm sürücüler yukarıda ele alındığı için `driver` burada `never`; yine de
  // şemaya yeni bir değer eklenirse açılışta net bir hata verir.
  throw new Error(`Push sürücüsü adaptörü henüz yazılmadı: ${String(driver)}`);
}

function selectEmailSender(
  config: AppConfigService,
  mock: MockEmailSender,
  smtp: SmtpEmailSender,
  resend: ResendEmailSender,
): EmailSender {
  const driver = config.notifications.mailDriver;
  warnIfMock(new Logger('NotificationSenderModule'), 'E-posta', driver);

  if (driver === 'mock') return mock;
  if (driver === 'smtp') return smtp;
  if (driver === 'resend') return resend;

  throw new Error(`E-posta sürücüsü adaptörü henüz yazılmadı: ${String(driver)}`);
}

function selectSmsSender(
  config: AppConfigService,
  mock: MockSmsSender,
  netgsm: NetgsmSmsSender,
  twilio: TwilioSmsSender,
): SmsSender {
  const driver = config.notifications.smsDriver;
  warnIfMock(new Logger('NotificationSenderModule'), 'SMS', driver);

  if (driver === 'mock') return mock;
  if (driver === 'netgsm') return netgsm;
  if (driver === 'twilio') return twilio;

  throw new Error(`SMS sürücüsü adaptörü henüz yazılmadı: ${String(driver)}`);
}

@Global()
@Module({
  providers: [
    NotificationOutbox,
    MockPushSender,
    MockEmailSender,
    MockSmsSender,
    ExpoPushSender,
    SmtpEmailSender,
    ResendEmailSender,
    NetgsmSmsSender,
    TwilioSmsSender,
    {
      provide: PUSH_SENDER,
      inject: [AppConfigService, MockPushSender, ExpoPushSender],
      useFactory: selectPushSender,
    },
    {
      provide: EMAIL_SENDER,
      inject: [AppConfigService, MockEmailSender, SmtpEmailSender, ResendEmailSender],
      useFactory: selectEmailSender,
    },
    {
      provide: SMS_SENDER,
      inject: [AppConfigService, MockSmsSender, NetgsmSmsSender, TwilioSmsSender],
      useFactory: selectSmsSender,
    },
  ],
  exports: [PUSH_SENDER, EMAIL_SENDER, SMS_SENDER, NotificationOutbox],
})
export class NotificationSenderModule {}
