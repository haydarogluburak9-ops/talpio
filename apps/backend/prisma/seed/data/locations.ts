/**
 * Başlangıç konum verisi — çok ülkeli demo.
 * Yeni şehirler admin panelinden veya bu dosyaya eklenerek tanımlanabilir.
 */

export interface DistrictSeed {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface CitySeed {
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  districts: DistrictSeed[];
}

export interface CountrySeed {
  code: string;
  name: string;
  phoneCode: string;
  currency: string;
  defaultLocale: string;
  cities: CitySeed[];
}

export const COUNTRIES: CountrySeed[] = [
  {
    code: 'TR',
    name: 'Türkiye',
    phoneCode: '+90',
    currency: 'TRY',
    defaultLocale: 'tr',
    cities: [
      {
        name: 'Istanbul',
        code: '34',
        latitude: 41.0082,
        longitude: 28.9784,
        districts: [
          { name: 'Kadıköy', latitude: 40.9819, longitude: 29.0365 },
          { name: 'Beşiktaş', latitude: 41.0422, longitude: 29.0067 },
        ],
      },
      {
        name: 'Ankara',
        code: '06',
        latitude: 39.9334,
        longitude: 32.8597,
        districts: [{ name: 'Çankaya', latitude: 39.9179, longitude: 32.8627 }],
      },
      {
        name: 'Gaziantep',
        code: '27',
        latitude: 37.0662,
        longitude: 37.3833,
        districts: [
          { name: 'Şahinbey', latitude: 37.0344, longitude: 37.3781 },
          { name: 'Şehitkamil', latitude: 37.1017, longitude: 37.3667 },
        ],
      },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    phoneCode: '+44',
    currency: 'GBP',
    defaultLocale: 'en',
    cities: [
      {
        name: 'London',
        code: 'LON',
        latitude: 51.5074,
        longitude: -0.1278,
        districts: [{ name: 'Westminster', latitude: 51.4975, longitude: -0.1357 }],
      },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    phoneCode: '+49',
    currency: 'EUR',
    defaultLocale: 'de',
    cities: [
      {
        name: 'Berlin',
        code: 'BER',
        latitude: 52.52,
        longitude: 13.405,
        districts: [{ name: 'Mitte', latitude: 52.5206, longitude: 13.387 }],
      },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    phoneCode: '+971',
    currency: 'AED',
    defaultLocale: 'ar',
    cities: [
      {
        name: 'Dubai',
        code: 'DXB',
        latitude: 25.2048,
        longitude: 55.2708,
        districts: [{ name: 'Dubai Marina', latitude: 25.0805, longitude: 55.1403 }],
      },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    phoneCode: '+1',
    currency: 'USD',
    defaultLocale: 'en',
    cities: [
      {
        name: 'New York',
        code: 'NYC',
        latitude: 40.7128,
        longitude: -74.006,
        districts: [{ name: 'Manhattan', latitude: 40.7831, longitude: -73.9712 }],
      },
    ],
  },
  {
    code: 'ES',
    name: 'Spain',
    phoneCode: '+34',
    currency: 'EUR',
    defaultLocale: 'es',
    cities: [
      {
        name: 'Madrid',
        code: 'MAD',
        latitude: 40.4168,
        longitude: -3.7038,
        districts: [{ name: 'Centro', latitude: 40.4154, longitude: -3.7074 }],
      },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    phoneCode: '+33',
    currency: 'EUR',
    defaultLocale: 'fr',
    cities: [
      {
        name: 'Paris',
        code: 'PAR',
        latitude: 48.8566,
        longitude: 2.3522,
        districts: [{ name: 'Le Marais', latitude: 48.8606, longitude: 2.3522 }],
      },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    phoneCode: '+81',
    currency: 'JPY',
    defaultLocale: 'en',
    cities: [
      {
        name: 'Tokyo',
        code: 'TYO',
        latitude: 35.6762,
        longitude: 139.6503,
        districts: [{ name: 'Shibuya', latitude: 35.658, longitude: 139.7016 }],
      },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    phoneCode: '+65',
    currency: 'SGD',
    defaultLocale: 'en',
    cities: [
      {
        name: 'Singapore',
        code: 'SIN',
        latitude: 1.3521,
        longitude: 103.8198,
        districts: [{ name: 'Marina Bay', latitude: 1.2834, longitude: 103.8607 }],
      },
    ],
  },
  {
    code: 'IN',
    name: 'India',
    phoneCode: '+91',
    currency: 'INR',
    defaultLocale: 'en',
    cities: [
      {
        name: 'Mumbai',
        code: 'BOM',
        latitude: 19.076,
        longitude: 72.8777,
        districts: [{ name: 'Bandra', latitude: 19.0596, longitude: 72.8295 }],
      },
    ],
  },
  {
    code: 'BR',
    name: 'Brazil',
    phoneCode: '+55',
    currency: 'BRL',
    defaultLocale: 'en',
    cities: [
      {
        name: 'São Paulo',
        code: 'SAO',
        latitude: -23.5505,
        longitude: -46.6333,
        districts: [{ name: 'Pinheiros', latitude: -23.5614, longitude: -46.7019 }],
      },
    ],
  },
  {
    code: 'EG',
    name: 'Egypt',
    phoneCode: '+20',
    currency: 'EGP',
    defaultLocale: 'ar',
    cities: [
      {
        name: 'Cairo',
        code: 'CAI',
        latitude: 30.0444,
        longitude: 31.2357,
        districts: [{ name: 'Zamalek', latitude: 30.0626, longitude: 31.2197 }],
      },
    ],
  },
];
