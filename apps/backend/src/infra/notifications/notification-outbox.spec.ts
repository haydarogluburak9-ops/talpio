import { NotificationChannel, NotificationType } from '@talpio/types';

import type { AppConfigService } from '@config/app-config.service';

import { NotificationOutbox, type OutboxEntry } from './notification-outbox';

function createOutbox(limit = 50): NotificationOutbox {
  const config = { notifications: { outboxLimit: limit } } as AppConfigService;
  return new NotificationOutbox(config);
}

function entry(overrides: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    channel: NotificationChannel.EMAIL,
    target: 'kullanici@ornek.com',
    type: NotificationType.SUPPORT_REPLY,
    params: { ticketSubject: 'Parola sıfırlama' },
    deepLink: null,
    locale: 'tr',
    sentAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('NotificationOutbox', () => {
  describe('sır temizliği', () => {
    it('bağlantıdaki sorgu dizesini atar', () => {
      // Jeton sorgu dizesinde taşınır; tamponu okuyabilen biri onunla parolayı
      // sıfırlayıp hesabı devralabilirdi.
      const outbox = createOutbox();
      outbox.record(
        entry({ deepLink: 'https://talpio.app/sifre-sifirla?token=gizli-jeton-degeri' }),
      );

      expect(outbox.list()[0]?.deepLink).toBe('https://talpio.app/sifre-sifirla');
    });

    it('fragment ile taşınan jetonu da atar', () => {
      const outbox = createOutbox();
      outbox.record(entry({ deepLink: 'https://talpio.app/dogrula#jeton' }));

      expect(outbox.list()[0]?.deepLink).toBe('https://talpio.app/dogrula');
    });

    it('tek kullanımlık kodu gizler', () => {
      // OTP, SMS akışında `ticketSubject` içinde taşınır.
      const outbox = createOutbox();
      outbox.record(
        entry({ channel: NotificationChannel.SMS, params: { ticketSubject: '483920' } }),
      );

      expect(outbox.list()[0]?.params).toEqual({ ticketSubject: '[gizlendi]' });
    });

    it('sırrı olmayan bağlantıyı olduğu gibi bırakır', () => {
      const outbox = createOutbox();
      outbox.record(entry({ deepLink: 'https://talpio.app/bildirimler' }));

      expect(outbox.list()[0]?.deepLink).toBe('https://talpio.app/bildirimler');
    });

    it('çağıranın nesnesini değiştirmez', () => {
      const outbox = createOutbox();
      const original = entry({ deepLink: 'https://talpio.app/sifre-sifirla?token=abc' });
      outbox.record(original);

      expect(original.deepLink).toBe('https://talpio.app/sifre-sifirla?token=abc');
      expect(original.params).toEqual({ ticketSubject: 'Parola sıfırlama' });
    });
  });

  it('sınırı aşınca en eski kaydı düşürür', () => {
    const outbox = createOutbox(2);
    outbox.record(entry({ target: 'bir@ornek.com' }));
    outbox.record(entry({ target: 'iki@ornek.com' }));
    outbox.record(entry({ target: 'uc@ornek.com' }));

    expect(outbox.list().map((row) => row.target)).toEqual(['uc@ornek.com', 'iki@ornek.com']);
  });
});
