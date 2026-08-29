/**
 * Yüklenen dosyanın gerçekten iddia ettiği türde olup olmadığını içeriğinden
 * doğrular.
 *
 * İstemcinin gönderdiği `Content-Type` başlığı bir iddiadan ibarettir; saldırgan
 * onu istediği gibi yazar. Dosyalar `media.talpio.app` üzerinden herkese açık
 * sunulduğu için, `image/jpeg` diye işaretlenmiş bir HTML ya da SVG yüklemek
 * tarayıcı içerik türünü yeniden yorumladığında saklı XSS'e dönüşebilirdi.
 *
 * Harici bir bağımlılık yerine imza tablosu tutuluyor: kabul edilen tür sayısı
 * az ve sabit, tespit kütüphaneleri ise bizim reddettiğimiz yüzlerce biçimi de
 * tanıyarak yüzeyi genişletirdi.
 */

/** Dosyanın başındaki sabit bayt dizisi. `offset` verilmezse baştan başlar. */
interface Signature {
  bytes: readonly number[];
  offset?: number;
}

/**
 * MIME türünden kabul edilebilir imzalara. Bir tür birden fazla imza taşıyabilir
 * (ör. WAV hem RIFF hem WAVE damgası ister, farklı konumlarda).
 */
const SIGNATURES: Record<string, readonly Signature[]> = {
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  // RIFF....WEBP
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46] },
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
  ],
  // HEIC/HEIF: ISO temel medya kabı; 4. bayttan itibaren 'ftyp'.
  'image/heic': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  'image/heif': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  'image/gif': [{ bytes: [0x47, 0x49, 0x46, 0x38] }],

  'video/mp4': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  'video/quicktime': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],
  // Matroska/WebM: EBML başlığı.
  'video/webm': [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],

  'audio/webm': [{ bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
  'audio/ogg': [{ bytes: [0x4f, 0x67, 0x67, 0x53] }],
  'audio/wav': [
    { bytes: [0x52, 0x49, 0x46, 0x46] },
    { bytes: [0x57, 0x41, 0x56, 0x45], offset: 8 },
  ],
  'audio/x-wav': [
    { bytes: [0x52, 0x49, 0x46, 0x46] },
    { bytes: [0x57, 0x41, 0x56, 0x45], offset: 8 },
  ],
  'audio/mp4': [{ bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 }],

  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
};

/**
 * Çerçevesiz ve ID3 etiketli MP3'ler ile AAC akışları tek bir sabit imzaya
 * oturmuyor; bu yüzden ayrı ele alınırlar.
 */
function looksLikeMpegAudio(buffer: Buffer): boolean {
  if (buffer.length < 3) return false;
  // ID3v2 etiketi ile başlayan dosyalar.
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  // Çerçeve senkronizasyonu: 11 bit 1.
  const second = buffer[1] ?? 0;
  return buffer[0] === 0xff && (second & 0xe0) === 0xe0;
}

function matches(buffer: Buffer, signature: Signature): boolean {
  const offset = signature.offset ?? 0;
  if (buffer.length < offset + signature.bytes.length) return false;
  return signature.bytes.every((byte, index) => buffer[offset + index] === byte);
}

/**
 * İçerik bildirilen türle uyuşuyor mu.
 *
 * Tanımadığımız bir tür için `true` döner: imza tablosunda karşılığı olmayan
 * bir MIME türü zaten `allowedMimeTypes` kontrolünden geçemez, dolayısıyla
 * buraya ulaşmaz. Burada `false` dönmek, tabloya yeni tür eklemeyi unutan
 * birinin geçerli yüklemeleri sessizce kırmasına yol açardı.
 */
export function matchesDeclaredType(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/aac') {
    return looksLikeMpegAudio(buffer);
  }

  const signatures = SIGNATURES[mimeType];
  if (!signatures) return true;

  return signatures.every((signature) => matches(buffer, signature));
}
