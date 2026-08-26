/**
 * Kategoriye özel talep alanları.
 *
 * Talep formu tek ve geneldir; dikeye özel alanlar (viskozite, raf ömrü,
 * montaj tipi …) koda gömülmez, buradan tohumlanıp `attribute_schemas`
 * tablosundan okunur. Değerler talebin `specifications` JSON alanına yazılır.
 *
 * Alan tipleri `AttributeFieldType` ile sınırlıdır:
 * string | number | decimal | boolean | enum | date.
 *
 * `enum` seçenekleri hem depolanan değer hem de ekranda görünen etikettir;
 * kategori adları gibi Türkçe tutulur.
 *
 * Temel formda zaten bulunan alanlar (miktar, birim, marka tercihi, teslimat
 * adresi, teslim tarihi) burada tekrarlanmaz.
 */
export interface AttributeSchemaSeed {
  categorySlug: string;
  version: number;
  fields: {
    key: string;
    label: string;
    type: 'string' | 'number' | 'decimal' | 'boolean' | 'enum' | 'date';
    required?: boolean;
    options?: string[];
    unit?: string;
    description?: string;
  }[];
}

export const ATTRIBUTE_SCHEMA_SEEDS: AttributeSchemaSeed[] = [
  {
    categorySlug: 'madeni-yag-kimya',
    version: 1,
    fields: [
      {
        key: 'productType',
        label: 'Ürün tipi',
        type: 'enum',
        required: true,
        options: [
          'Motor yağı',
          'Hidrolik yağ',
          'Dişli yağı',
          'Endüstriyel yağ',
          'Transmisyon yağı',
          'Gres',
        ],
      },
      {
        key: 'viscosity',
        label: 'Viskozite',
        type: 'string',
        required: true,
        description: 'Örn. 5W-30, ISO VG 46',
      },
      {
        key: 'standard',
        label: 'Standart / spesifikasyon',
        type: 'string',
        description: 'Örn. API SN, ACEA C3, DIN 51524',
      },
      {
        key: 'packagingType',
        label: 'Ambalaj',
        type: 'enum',
        required: true,
        options: ['Varil', 'Bidon', 'IBC', 'Dökme'],
      },
      { key: 'invoiceRequired', label: 'Fatura gerekli', type: 'boolean' },
      { key: 'alternativeBrandAllowed', label: 'Alternatif marka kabul edilir', type: 'boolean' },
    ],
  },
  {
    categorySlug: 'elektronik-komponent',
    version: 1,
    fields: [
      {
        key: 'componentType',
        label: 'Komponent tipi',
        type: 'enum',
        required: true,
        options: [
          'Pasif komponent',
          'Aktif komponent / IC',
          'Mikrodenetleyici',
          'Sensör',
          'Konnektör',
          'PCB',
        ],
      },
      {
        key: 'manufacturerPartNumber',
        label: 'Üretici parça numarası (MPN)',
        type: 'string',
        required: true,
        description: 'Muadil kabul ediyorsanız açıklamaya not düşün',
      },
      {
        key: 'mountingType',
        label: 'Montaj tipi',
        type: 'enum',
        options: ['SMD', 'THT', 'Modül'],
      },
      { key: 'tolerancePercent', label: 'Tolerans', type: 'decimal', unit: '%' },
      { key: 'operatingVoltage', label: 'Çalışma gerilimi', type: 'string', unit: 'V' },
      { key: 'rohsCompliant', label: 'RoHS uyumlu olmalı', type: 'boolean' },
    ],
  },
  {
    categorySlug: 'gida-icecek-toptan',
    version: 1,
    fields: [
      {
        key: 'storageCondition',
        label: 'Saklama koşulu',
        type: 'enum',
        required: true,
        options: ['Kuru gıda', 'Soğuk zincir (0-4 °C)', 'Donuk (-18 °C)'],
      },
      {
        key: 'minShelfLifeDays',
        label: 'Asgari raf ömrü',
        type: 'number',
        required: true,
        unit: 'gün',
        description: 'Teslimat tarihinden itibaren kalan süre',
      },
      {
        key: 'packagingType',
        label: 'Ambalaj',
        type: 'enum',
        options: ['Koli', 'Çuval', 'Palet', 'Kasa', 'Dökme'],
      },
      {
        key: 'certification',
        label: 'Sertifika',
        type: 'enum',
        options: ['Fark etmez', 'Helal', 'ISO 22000', 'Organik'],
      },
      { key: 'earliestProductionDate', label: 'En erken üretim tarihi', type: 'date' },
    ],
  },
];
