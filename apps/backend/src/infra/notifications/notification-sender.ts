import type { NotificationParams, NotificationType } from '@talpio/types';

/** Nest DI belirteçleri; etkin sürücüler ortam değişkeninden seçilir. */
export const PUSH_SENDER = Symbol('PUSH_SENDER');
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export const SMS_SENDER = Symbol('SMS_SENDER');

/**
 * Kanal sürücülerine iletilen yük.
 *
 * Sunucu hazır cümle taşımaz: tür, parametreler ve alıcının dili gider. Metni
 * çözmek sürücünün işidir — push gövdesini işletim sistemi gösterdiği için
 * oradaki metin `params` ve `locale` ile son anda üretilir.
 */
export interface NotificationMessage {
  type: NotificationType;
  params: NotificationParams;
  deepLink: string | null;
  locale: string;
}

export interface PushTarget {
  /** Cihaz jetonu; aynı kullanıcının birden çok cihazı olabilir. */
  tokens: string[];
}

export interface EmailTarget {
  email: string;
  /** Hitap için; adı olmayan hesaplarda boş geçilir. */
  name?: string | null;
}

export interface SmsTarget {
  phone: string;
}

/**
 * Gönderim sonucu.
 *
 * Sürücü hata fırlatmak yerine sonucu döner; bildirim merkezi kanal başına
 * başarısızlığı ayrı ayrı günlüğe yazar ve ana akışı etkilemez.
 */
export interface SendResult {
  delivered: boolean;
  /** Başarısızlık nedeni; başarılı gönderimde boştur. */
  failureReason?: string | null;
}

export interface PushSender {
  readonly name: string;

  send(target: PushTarget, message: NotificationMessage): Promise<SendResult>;
}

export interface EmailSender {
  readonly name: string;

  send(target: EmailTarget, message: NotificationMessage): Promise<SendResult>;
}

export interface SmsSender {
  readonly name: string;

  send(target: SmsTarget, message: NotificationMessage): Promise<SendResult>;
}
