import { Injectable } from '@nestjs/common';
import type { NotificationChannel, NotificationParams, NotificationType } from '@talpio/types';

import { AppConfigService } from '@config/app-config.service';

export interface OutboxEntry {
  channel: NotificationChannel;
  /** Jeton, e-posta veya telefon; gönderimin kime gittiğini duman testi doğrular. */
  target: string;
  type: NotificationType;
  params: NotificationParams;
  deepLink: string | null;
  locale: string;
  sentAt: string;
}

export interface OutboxFilter {
  channel?: NotificationChannel;
  type?: NotificationType;
  target?: string;
}

/**
 * Mock sürücülerin gönderim kayıtları.
 *
 * Gerçek sağlayıcı yokken duman testinin "bildirim gerçekten gönderildi mi"
 * sorusuna yanıt verebilmesi için gönderimler bellekte tutulur. Tampon
 * sınırlıdır ve süreçle birlikte kaybolur: birden fazla iş sürecinin (cluster)
 * çalıştığı ortamda istek başka sürece düşerse tampon boş görünür. Bu yüzden
 * yalnızca tek süreçli geliştirme ortamında anlamlıdır; kalıcı denetim izi
 * gerektiğinde `Notification` kaydı ile ayrı bir gönderim tablosu kullanılmalıdır.
 */
@Injectable()
export class NotificationOutbox {
  private readonly entries: OutboxEntry[] = [];

  constructor(private readonly config: AppConfigService) {}

  record(entry: OutboxEntry): void {
    this.entries.push(entry);

    const overflow = this.entries.length - this.config.notifications.outboxLimit;
    if (overflow > 0) this.entries.splice(0, overflow);
  }

  /** En yeni kayıt başta döner; duman testi son gönderimi arar. */
  list(filter: OutboxFilter = {}): OutboxEntry[] {
    return this.entries
      .filter(
        (entry) =>
          (!filter.channel || entry.channel === filter.channel) &&
          (!filter.type || entry.type === filter.type) &&
          (!filter.target || entry.target === filter.target),
      )
      .reverse();
  }

  clear(): void {
    this.entries.length = 0;
  }
}
