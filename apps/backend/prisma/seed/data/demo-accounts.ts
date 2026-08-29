import type { SupportedLocale } from '@talpio/config';

import { UserRole } from '../../../src/generated/prisma/enums';

export interface DemoAccount {
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  socialUsername: string;
  /**
   * Hesabın arayüz dili.
   *
   * Vitrin ağı yalnızca Türkçe hesaplardan oluşursa çok dilli destek
   * görünmez kalır. Biyografi ve tanıtım metinleri de bu dilde yazılır.
   */
  locale: SupportedLocale;
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
    locale: 'tr',
    bio: 'Platform yönetimi.',
    locationText: 'Istanbul',
  },
  {
    email: 'destek@talpio.com',
    fullName: 'Talpio Destek',
    phone: '+905320000002',
    role: UserRole.SUPPORT,
    socialUsername: 'talpiodestek',
    locale: 'tr',
    bio: 'Destek ve moderasyon.',
    locationText: 'Istanbul',
  },
  {
    email: 'kullanici@talpio.com',
    fullName: 'Burak Yılmaz',
    phone: '+905320000101',
    role: UserRole.CUSTOMER,
    socialUsername: 'burak',
    locale: 'tr',
    bio: 'Şantiye ve atölye için doğru tedarikçi arıyorum.',
    locationText: 'Istanbul',
  },
  {
    email: 'satici@talpio.com',
    fullName: 'Elif Demir',
    phone: '+905320000102',
    role: UserRole.PROVIDER,
    socialUsername: 'elifyag',
    locale: 'tr',
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
    locale: 'tr',
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
    locale: 'tr',
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
    locale: 'tr',
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
    locale: 'tr',
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
    locale: 'tr',
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
    locale: 'tr',
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
    locale: 'tr',
    bio: 'Atölye için hammadde ve sarf alıyorum.',
    locationText: 'New York',
  },
  {
    email: 'murat@talpio.com',
    fullName: 'Murat Şahin',
    phone: '+905320000110',
    role: UserRole.CUSTOMER,
    socialUsername: 'muratsahin',
    locale: 'tr',
    bio: 'Toptan alım ve fiyat karşılaştırması.',
    locationText: 'Berlin',
  },

  // --- Uluslararası vitrin hesapları -------------------------------------
  // Kendi dillerinde yazılırlar: ağın yalnızca Türkçe görünmesi, çok dilli
  // desteği görünmez kılıyor ve yurt dışından gelen ziyaretçiye platform boş
  // hissettiriyordu. Kategoriler de bilinçli olarak dağıtıldı; hepsi inşaat
  // olduğunda pazaryeri tek dikeyden ibaret görünüyor.

  {
    email: 'lukas@talpio.com',
    fullName: 'Lukas Brandt',
    phone: '+4915100000201',
    role: UserRole.PROVIDER,
    socialUsername: 'lukasbrandt',
    locale: 'de',
    bio: 'Industriemaschinen und Ersatzteile.',
    locationText: 'Berlin',
    provider: {
      businessName: 'Brandt Industrietechnik',
      storeUsername: 'brandtindustrie',
      about:
        'Industriemaschinen, Ersatzteile und Wartung. Angebote für Werkstätten und Produktionsbetriebe.',
      experienceYears: 18,
      categorySlug: 'makine-ekipman',
      cityName: 'Berlin',
      verified: true,
    },
  },
  {
    email: 'anna@talpio.com',
    fullName: 'Anna Vogel',
    phone: '+4915100000202',
    role: UserRole.CUSTOMER,
    socialUsername: 'annavogel',
    locale: 'de',
    bio: 'Einkauf für eine Möbelmanufaktur.',
    locationText: 'Berlin',
  },
  {
    email: 'camille@talpio.com',
    fullName: 'Camille Laurent',
    phone: '+33612000203',
    role: UserRole.PROVIDER,
    socialUsername: 'camillelaurent',
    locale: 'fr',
    bio: "Emballage et logistique pour l'industrie.",
    locationText: 'Paris',
    provider: {
      businessName: 'Laurent Emballage',
      storeUsername: 'laurentemballage',
      about: "Cartons, palettes et films d'emballage. Livraison en Europe et tarifs dégressifs.",
      experienceYears: 12,
      categorySlug: 'ambalaj-lojistik',
      cityName: 'Paris',
      verified: true,
    },
  },
  {
    email: 'julien@talpio.com',
    fullName: 'Julien Moreau',
    phone: '+33612000204',
    role: UserRole.CUSTOMER,
    socialUsername: 'julienmoreau',
    locale: 'fr',
    bio: "Responsable achats dans l'agroalimentaire.",
    locationText: 'Paris',
  },
  {
    email: 'carmen@talpio.com',
    fullName: 'Carmen Ortega',
    phone: '+34612000205',
    role: UserRole.PROVIDER,
    socialUsername: 'carmenortega',
    locale: 'es',
    bio: 'Distribución de alimentación al por mayor.',
    locationText: 'Madrid',
    provider: {
      businessName: 'Ortega Alimentación',
      storeUsername: 'ortegaalimentacion',
      about: 'Aceite de oliva, conservas y legumbres al por mayor. Envíos a toda la península.',
      experienceYears: 22,
      categorySlug: 'gida-icecek-toptan',
      cityName: 'Madrid',
      verified: true,
    },
  },
  {
    email: 'diego@talpio.com',
    fullName: 'Diego Ramírez',
    phone: '+34612000206',
    role: UserRole.CUSTOMER,
    socialUsername: 'diegoramirez',
    locale: 'es',
    bio: 'Compras para una cadena de restaurantes.',
    locationText: 'Madrid',
  },
  {
    email: 'omar@talpio.com',
    fullName: 'Omar Al-Farsi',
    phone: '+971501000207',
    role: UserRole.PROVIDER,
    socialUsername: 'omaralfarsi',
    locale: 'ar',
    bio: 'زيوت صناعية ومواد كيميائية بالجملة.',
    locationText: 'Dubai',
    provider: {
      businessName: 'Al-Farsi Trading',
      storeUsername: 'alfarsitrading',
      about: 'زيوت المحركات والزيوت الهيدروليكية والمواد الكيميائية. شحن سريع إلى الخليج.',
      experienceYears: 15,
      categorySlug: 'madeni-yag-kimya',
      cityName: 'Dubai',
      verified: true,
    },
  },
  {
    email: 'layla@talpio.com',
    fullName: 'Layla Haddad',
    phone: '+201001000208',
    role: UserRole.PROVIDER,
    socialUsername: 'laylahaddad',
    locale: 'ar',
    bio: 'أقمشة وملابس جاهزة للتصدير.',
    locationText: 'Cairo',
    provider: {
      businessName: 'Haddad Textiles',
      storeUsername: 'haddadtextiles',
      about: 'أقمشة قطنية وملابس جاهزة. إنتاج بالجملة وتصدير إلى أوروبا والخليج.',
      experienceYears: 13,
      categorySlug: 'giyim-moda',
      cityName: 'Cairo',
    },
  },
  {
    email: 'youssef@talpio.com',
    fullName: 'Youssef Mansour',
    phone: '+201001000209',
    role: UserRole.CUSTOMER,
    socialUsername: 'youssefmansour',
    locale: 'ar',
    bio: 'مشتريات لشركة مقاولات.',
    locationText: 'Cairo',
  },
  {
    email: 'oliver@talpio.com',
    fullName: 'Oliver Bennett',
    phone: '+447700000210',
    role: UserRole.PROVIDER,
    socialUsername: 'oliverbennett',
    locale: 'en',
    bio: 'Electronic components and sourcing.',
    locationText: 'London',
    provider: {
      businessName: 'Bennett Electronics',
      storeUsername: 'bennettelectronics',
      about:
        'Passive and active components, connectors and PCBs. Reel and cut-tape quantities from stock.',
      experienceYears: 11,
      categorySlug: 'elektronik-komponent',
      cityName: 'London',
      verified: true,
    },
  },
  {
    email: 'emma@talpio.com',
    fullName: 'Emma Clarke',
    phone: '+447700000211',
    role: UserRole.PROVIDER,
    socialUsername: 'emmaclarke',
    locale: 'en',
    bio: 'Medical consumables and clinic supply.',
    locationText: 'London',
    provider: {
      businessName: 'Clarke Medical',
      storeUsername: 'clarkemedical',
      about: 'Disposables, PPE and clinic equipment. CE-marked stock with traceable batches.',
      experienceYears: 9,
      categorySlug: 'saglik-medikal',
      cityName: 'London',
    },
  },
  {
    email: 'grace@talpio.com',
    fullName: 'Grace Sullivan',
    phone: '+12125550212',
    role: UserRole.CUSTOMER,
    socialUsername: 'gracesullivan',
    locale: 'en',
    bio: 'Sourcing for a hardware startup.',
    locationText: 'New York',
  },
  {
    email: 'wei@talpio.com',
    fullName: 'Wei Lim',
    phone: '+6581000213',
    role: UserRole.PROVIDER,
    socialUsername: 'weilim',
    locale: 'en',
    bio: 'Freight forwarding and warehousing.',
    locationText: 'Singapore',
    provider: {
      businessName: 'Lim Logistics',
      storeUsername: 'limlogistics',
      about: 'Sea and air freight, bonded warehousing and customs clearance across Southeast Asia.',
      experienceYears: 17,
      categorySlug: 'ambalaj-lojistik',
      cityName: 'Singapore',
      verified: true,
    },
  },
  {
    email: 'priya@talpio.com',
    fullName: 'Priya Nair',
    phone: '+919820000214',
    role: UserRole.PROVIDER,
    socialUsername: 'priyanair',
    locale: 'en',
    bio: 'Cotton textiles and garment manufacturing.',
    locationText: 'Mumbai',
    provider: {
      businessName: 'Nair Textiles',
      storeUsername: 'nairtextiles',
      about: 'Cotton and blended fabrics, private-label garment production. MOQ from 500 pieces.',
      experienceYears: 21,
      categorySlug: 'giyim-moda',
      cityName: 'Mumbai',
      verified: true,
    },
  },
  {
    email: 'kenji@talpio.com',
    fullName: 'Kenji Tanaka',
    phone: '+818000000215',
    role: UserRole.PROVIDER,
    socialUsername: 'kenjitanaka',
    locale: 'en',
    bio: 'Precision machining and tooling.',
    locationText: 'Tokyo',
    provider: {
      businessName: 'Tanaka Precision',
      storeUsername: 'tanakaprecision',
      about: 'CNC machining, jigs and precision tooling. Prototype to small-series production.',
      experienceYears: 26,
      categorySlug: 'makine-ekipman',
      cityName: 'Tokyo',
      verified: true,
    },
  },
  {
    email: 'sofia@talpio.com',
    fullName: 'Sofia Almeida',
    phone: '+5511990000216',
    role: UserRole.CUSTOMER,
    socialUsername: 'sofiaalmeida',
    locale: 'es',
    bio: 'Compras para una distribuidora de bebidas.',
    locationText: 'São Paulo',
  },
];
