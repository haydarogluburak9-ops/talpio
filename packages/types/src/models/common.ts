/** Tüm varlıkların ortak alanları. Tarihler ISO 8601 metni olarak taşınır. */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Parasal tutar. Kayan noktalı sayı asla kullanılmaz; tutar en küçük para
 * biriminde (TRY için kuruş) tam sayı olarak taşınır.
 */
export interface Money {
  /** Kuruş cinsinden tutar. Örn. 149,90 TL için 14990. */
  amountMinor: number;
  /** ISO 4217 kodu. Örn. "TRY". */
  currency: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface TimeRange {
  start: string;
  end: string;
}

/** Listelerde ve kartlarda kullanılan hafif referans. */
export interface EntityRef {
  id: string;
  name: string;
}

/**
 * Kullanıcıya görünen, veritabanında saklanan metin. Dil kodundan (`tr`, `en`
 * …) metne eşlemedir; düz string ise metin bütün dillerde aynı kabul edilir.
 *
 * Çözümleme istemcide yapılır (`resolveLocalizedText`): uç bütün dilleri
 * birden döndürür, böylece dil değiştiğinde veri yeniden çekilmez.
 */
export type LocalizedText = string | Readonly<Record<string, string>>;

/** Yüklenen dosyanın hangi amaca hizmet ettiği. Kabul edilen türleri belirler. */
export const FilePurpose = {
  /** Talep fotoğrafları ve sohbet görselleri: herkese açık okunabilir. */
  JOB_PHOTO: 'JOB_PHOTO',
  MESSAGE_ATTACHMENT: 'MESSAGE_ATTACHMENT',
  AVATAR: 'AVATAR',
  REVIEW_PHOTO: 'REVIEW_PHOTO',
  /** Sosyal gönderi medyası. */
  POST_MEDIA: 'POST_MEDIA',
  /** Sosyal profil kapak görseli. */
  COVER: 'COVER',
  /** Satıcı belgeleri: yalnızca sahibi ve yönetim görebilir. */
  PROVIDER_DOCUMENT: 'PROVIDER_DOCUMENT',
} as const;

export type FilePurpose = (typeof FilePurpose)[keyof typeof FilePurpose];

/**
 * Yüklenmiş dosyanın üst verisi.
 *
 * İçerik nesne deposunda durur; API yalnızca erişim adresini taşır. Gizli
 * dosyalarda adres süreli imzalıdır ve paylaşılamaz.
 */
export interface FileAsset {
  id: string;
  url: string;
  /** Video / büyük görseller için küçük resim (CDN üzerinden). */
  thumbnailUrl?: string | null;
  mimeType: string;
  sizeBytes: number;
  originalName?: string | null;
  isPublic: boolean;
  createdAt: string;
}
