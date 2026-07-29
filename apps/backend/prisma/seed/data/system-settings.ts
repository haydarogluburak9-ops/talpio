/**
 * Admin panelinden yönetilecek varsayılan sistem ayarları.
 * Bu değerler koda gömülmez; servisler ayarları veritabanından okur.
 */

export interface SystemSettingSeed {
  key: string;
  value: unknown;
  description: string;
  isSecret?: boolean;
}

export const SYSTEM_SETTINGS: SystemSettingSeed[] = [
  {
    key: 'platform.defaultCommissionBps',
    value: 1250,
    description: 'Varsayılan platform komisyonu (baz puan). 1250 = %12,5',
  },
  {
    key: 'platform.defaultCommissionFixedMinor',
    value: 0,
    description: 'Komisyona eklenen sabit hizmet bedeli (kuruş)',
  },
  {
    key: 'job.maxMediaCount',
    value: 10,
    description: 'Bir iş talebine eklenebilecek en fazla fotoğraf sayısı',
  },
  {
    key: 'job.offerWindowHours',
    value: 72,
    description: 'Bir iş talebinin teklife açık kalma süresi (saat)',
  },
  {
    key: 'offer.defaultValidityHours',
    value: 48,
    description: 'Teklifin varsayılan geçerlilik süresi (saat)',
  },
  {
    key: 'master.requireVerificationForOffers',
    value: true,
    description: 'Teklif verebilmek için usta doğrulaması zorunlu olsun mu?',
  },
  {
    key: 'messaging.blockContactSharing',
    value: true,
    description: 'Mesajlarda telefon ve IBAN paylaşımı denetlensin mi?',
  },
  {
    key: 'review.minDaysAfterCompletion',
    value: 0,
    description: 'İş tamamlandıktan sonra değerlendirme için beklenecek gün sayısı',
  },
  {
    key: 'support.responseTargetHours',
    value: 24,
    description: 'Destek taleplerine ilk yanıt hedefi (saat)',
  },
];
