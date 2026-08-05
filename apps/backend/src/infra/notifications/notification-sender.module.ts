import { Global, Logger, Module } from '@nestjs/common';

import { AppConfigService } from '@config/app-config.service';

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

function selectPushSender(config: AppConfigService, mock: MockPushSender): PushSender {
  const driver = config.notifications.pushDriver;
  warnIfMock(new Logger('NotificationSenderModule'), 'Push', driver);

  if (driver === 'mock') return mock;

  // Ayakta kalıp her gönderimde hata vermektense açılışta durmak yeğdir.
  throw new Error(`Push sürücüsü adaptörü henüz yazılmadı: ${driver}`);
}

function selectEmailSender(config: AppConfigService, mock: MockEmailSender): EmailSender {
  const driver = config.notifications.mailDriver;
  warnIfMock(new Logger('NotificationSenderModule'), 'E-posta', driver);

  if (driver === 'mock') return mock;

  throw new Error(`E-posta sürücüsü adaptörü henüz yazılmadı: ${driver}`);
}

function selectSmsSender(config: AppConfigService, mock: MockSmsSender): SmsSender {
  const driver = config.notifications.smsDriver;

  if (driver === 'mock') return mock;

  throw new Error(`SMS sürücüsü adaptörü henüz yazılmadı: ${driver}`);
}

@Global()
@Module({
  providers: [
    NotificationOutbox,
    MockPushSender,
    MockEmailSender,
    MockSmsSender,
    {
      provide: PUSH_SENDER,
      inject: [AppConfigService, MockPushSender],
      useFactory: selectPushSender,
    },
    {
      provide: EMAIL_SENDER,
      inject: [AppConfigService, MockEmailSender],
      useFactory: selectEmailSender,
    },
    {
      provide: SMS_SENDER,
      inject: [AppConfigService, MockSmsSender],
      useFactory: selectSmsSender,
    },
  ],
  exports: [PUSH_SENDER, EMAIL_SENDER, SMS_SENDER, NotificationOutbox],
})
export class NotificationSenderModule {}
