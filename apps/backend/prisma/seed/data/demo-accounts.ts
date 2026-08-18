import { UserRole } from '../../../src/generated/prisma/enums';

export interface DemoAccount {
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  socialUsername: string;
  bio?: string;
  locationText?: string;
  /** Satıcı hesabı için ek profil bilgileri. */
  provider?: {
    businessName: string;
    storeUsername: string;
    about: string;
    experienceYears: number;
    categorySlug: string;
    cityName: string;
    verified?: boolean;
  };
}

/** Eski marka demo e-postaları — seed sırasında devre dışı bırakılır. */
export const LEGACY_DEMO_EMAILS = [
  'admin@ustapilot.com',
  'destek@ustapilot.com',
  'musteri@ustapilot.com',
  'usta@ustapilot.com',
] as const;

/**
 * Yalnızca geliştirme ve demo ortamlarında oluşturulur. Parola tek bir ortam
 * değişkeninden gelir ve hiçbir zaman koda gömülmez.
 *
 * Giriş: kullanici@ / satici@  — diğerleri ağı doldurur, aynı parola.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@talpio.com',
    fullName: 'Talpio Yönetici',
    phone: '+905320000001',
    role: UserRole.SUPER_ADMIN,
    socialUsername: 'talpioadmin',
    bio: 'Platform yönetimi.',
    locationText: 'Istanbul',
  },
  {
    email: 'destek@talpio.com',
    fullName: 'Talpio Destek',
    phone: '+905320000002',
    role: UserRole.SUPPORT,
    socialUsername: 'talpiodestek',
    bio: 'Destek ve moderasyon.',
    locationText: 'Istanbul',
  },
  {
    email: 'kullanici@talpio.com',
    fullName: 'Burak Yılmaz',
    phone: '+905320000101',
    role: UserRole.CUSTOMER,
    socialUsername: 'burak',
    bio: 'Şantiye ve atölye için doğru tedarikçi arıyorum.',
    locationText: 'Istanbul',
  },
  {
    email: 'satici@talpio.com',
    fullName: 'Elif Demir',
    phone: '+905320000102',
    role: UserRole.PROVIDER,
    socialUsername: 'elifyag',
    bio: 'Madeni yağda stok ve hızlı sevkiyat.',
    locationText: 'Dubai',
    provider: {
      businessName: 'Demir Madeni Yağ',
      storeUsername: 'demiryag',
      about: 'Motor yağı, hidrolik ve endüstriyel yağ tedariki. B2B teklif ve hızlı sevkiyat.',
      experienceYears: 10,
      categorySlug: 'madeni-yag-kimya',
      cityName: 'Dubai',
      verified: true,
    },
  },
  {
    email: 'ahmet@talpio.com',
    fullName: 'Ahmet Kaya',
    phone: '+905320000103',
    role: UserRole.PROVIDER,
    socialUsername: 'ahmetkaya',
    bio: 'Beton, demir ve şantiye malzemesi.',
    locationText: 'Istanbul',
    provider: {
      businessName: 'Ahmet Yapı',
      storeUsername: 'ahmetyapi',
      about: 'İnşaat malzemesi toptan. Çimento, demir, tuğla ve şantiye lojistiği.',
      experienceYears: 14,
      categorySlug: 'insaat-yapi',
      cityName: 'Istanbul',
      verified: true,
    },
  },
  {
    email: 'xyz@talpio.com',
    fullName: 'Zeynep Aksoy',
    phone: '+905320000104',
    role: UserRole.PROVIDER,
    socialUsername: 'zeynepaksoy',
    bio: 'Kablo, pano ve aydınlatma.',
    locationText: 'Berlin',
    provider: {
      businessName: 'XYZ Ticaret',
      storeUsername: 'xyzelektrik',
      about: 'Elektrik malzemesi ve pano ekipmanı. Proje bazlı tedarik.',
      experienceYears: 8,
      categorySlug: 'insaat-yapi',
      cityName: 'Berlin',
    },
  },
  {
    email: 'pvc@talpio.com',
    fullName: 'Hasan Öztürk',
    phone: '+905320000105',
    role: UserRole.PROVIDER,
    socialUsername: 'hasanozturk',
    bio: 'PVC doğrama ve profil.',
    locationText: 'Gaziantep',
    provider: {
      businessName: 'Gaziantep PVC',
      storeUsername: 'ganteppvc',
      about: 'Pencere, kapı ve cephe için PVC profil. Bölgesel teslimat.',
      experienceYears: 11,
      categorySlug: 'insaat-yapi',
      cityName: 'Gaziantep',
    },
  },
  {
    email: 'cimento@talpio.com',
    fullName: 'Mehmet Aslan',
    phone: '+905320000106',
    role: UserRole.PROVIDER,
    socialUsername: 'mehmetaslan',
    bio: 'Çimento ve agrega toptan.',
    locationText: 'Adana',
    provider: {
      businessName: 'Anadolu Çimento',
      storeUsername: 'anadolucimento',
      about: 'Çimento, hazır beton ve agrega. Filo ile şantiye teslimi.',
      experienceYears: 20,
      categorySlug: 'insaat-yapi',
      cityName: 'Ankara',
      verified: true,
    },
  },
  {
    email: 'metal@talpio.com',
    fullName: 'Cem Yıldız',
    phone: '+905320000107',
    role: UserRole.PROVIDER,
    socialUsername: 'cemyildiz',
    bio: 'Sac, profil ve demir çelik.',
    locationText: 'London',
    provider: {
      businessName: 'Metal Plus',
      storeUsername: 'metalplus',
      about: 'Sac, kutu profil, inşaat demiri. Kesim ve sevkiyat.',
      experienceYears: 9,
      categorySlug: 'insaat-yapi',
      cityName: 'London',
    },
  },
  {
    email: 'deniz@talpio.com',
    fullName: 'Deniz Arslan',
    phone: '+905320000108',
    role: UserRole.PROVIDER,
    socialUsername: 'denizarslan',
    bio: 'Taahhüt ve malzeme alımı.',
    locationText: 'Madrid',
    provider: {
      businessName: 'Deniz İnşaat',
      storeUsername: 'denizinsaat',
      about: 'Konut ve sanayi taahhüt. Malzeme ve taşeron ağı.',
      experienceYears: 16,
      categorySlug: 'insaat-yapi',
      cityName: 'Madrid',
    },
  },
  {
    email: 'selin@talpio.com',
    fullName: 'Selin Koç',
    phone: '+905320000109',
    role: UserRole.CUSTOMER,
    socialUsername: 'selinkoc',
    bio: 'Atölye için hammadde ve sarf alıyorum.',
    locationText: 'New York',
  },
  {
    email: 'murat@talpio.com',
    fullName: 'Murat Şahin',
    phone: '+905320000110',
    role: UserRole.CUSTOMER,
    socialUsername: 'muratsahin',
    bio: 'Toptan alım ve fiyat karşılaştırması.',
    locationText: 'Berlin',
  },
];
