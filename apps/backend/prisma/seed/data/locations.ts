/**
 * Başlangıç konum verisi.
 * İlk pazar Gaziantep olduğu için yalnızca bu şehir ve ilçeleri yüklenir.
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
        name: 'Gaziantep',
        code: '27',
        latitude: 37.0662,
        longitude: 37.3833,
        districts: [
          { name: 'Şahinbey', latitude: 37.0344, longitude: 37.3781 },
          { name: 'Şehitkamil', latitude: 37.1017, longitude: 37.3667 },
          { name: 'Oğuzeli', latitude: 36.9633, longitude: 37.5117 },
          { name: 'Nizip', latitude: 37.0092, longitude: 37.7947 },
          { name: 'İslahiye', latitude: 37.0264, longitude: 36.6317 },
          { name: 'Nurdağı', latitude: 37.1783, longitude: 36.7358 },
          { name: 'Araban', latitude: 37.4256, longitude: 37.6919 },
          { name: 'Yavuzeli', latitude: 37.3175, longitude: 37.5675 },
          { name: 'Karkamış', latitude: 36.8367, longitude: 37.9928 },
        ],
      },
    ],
  },
];
