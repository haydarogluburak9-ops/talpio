/**
 * Sohbette iletişim bilgisi paylaşımını sezer.
 *
 * Platform dışına çıkan anlaşmalarda müşteri güvencesi ve satıcı hakedişi
 * korunamaz. Mesaj engellenmez — engellemek meşru konuşmaları da keserdi —
 * yalnızca işaretlenir ve denetime düşer.
 */

/** 10 hane ve üzeri rakam dizisi; aradaki boşluk, nokta ve tire yok sayılır. */
const PHONE_PATTERN = /(?:\+?\d[\s.\-()]*){10,}/;

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.]{2,}/i;

/**
 * Rakamları harfe çevirerek yazılan numaralar: "sıfır beş üç iki ...".
 *
 * Sözcük sınırı (`\b`) ASCII tabanlıdır ve "sıfır", "üç" gibi sözcüklerde
 * yanlış yerde eşleşir; bu yüzden metin belirteçlere ayrılıp taranır.
 */
const DIGIT_WORDS = new Set([
  'sıfır',
  'bir',
  'iki',
  'üç',
  'dört',
  'beş',
  'altı',
  'yedi',
  'sekiz',
  'dokuz',
]);

/** Harfle yazılmış bir numara sayılması için gereken ardışık rakam sözcüğü. */
const SPELLED_RUN_THRESHOLD = 7;

/** Yaygın mesajlaşma uygulamalarına yönlendirme. */
const OFF_PLATFORM_PATTERN =
  /(whats\s?app|wp'?den|telegram|instagram|dm'?den|direkt\s?mesaj)/i;

export interface ContactDetection {
  isFlagged: boolean;
  /** İşaretlemeye yol açan kural. Denetim ekranında gösterilir. */
  reasons: ContactReason[];
}

export type ContactReason = 'PHONE' | 'EMAIL' | 'SPELLED_PHONE' | 'OFF_PLATFORM';

export function detectContactSharing(body: string | null | undefined): ContactDetection {
  if (!body) return { isFlagged: false, reasons: [] };

  const reasons: ContactReason[] = [];

  if (PHONE_PATTERN.test(body)) reasons.push('PHONE');
  if (EMAIL_PATTERN.test(body)) reasons.push('EMAIL');
  if (hasSpelledPhone(body)) reasons.push('SPELLED_PHONE');
  if (OFF_PLATFORM_PATTERN.test(body)) reasons.push('OFF_PLATFORM');

  return { isFlagged: reasons.length > 0, reasons };
}

/** Peş peşe yeterince rakam sözcüğü geçiyor mu? */
function hasSpelledPhone(body: string): boolean {
  let run = 0;

  for (const token of body.toLocaleLowerCase('tr-TR').split(/[^\p{L}]+/u)) {
    run = DIGIT_WORDS.has(token) ? run + 1 : 0;
    if (run >= SPELLED_RUN_THRESHOLD) return true;
  }

  return false;
}
