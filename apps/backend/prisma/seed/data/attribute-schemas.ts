import type { AttributeFieldType, LocalizedText } from '@talpio/types';

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
 * Görünen metinler (`label`, `description`, `unit` ve enum etiketleri) dil
 * kodundan metne eşlemedir; çözümleme istemcide yapılır. Enum seçeneklerinin
 * `value` alanı talebe yazılan sabittir ve dile göre değişmez; yalnızca
 * `label` çevrilir. Böylece aynı ürün, form hangi dilde doldurulursa
 * doldurulsun tek bir değerle kaydedilir.
 *
 * Temel formda zaten bulunan alanlar (miktar, birim, marka tercihi, teslimat
 * adresi, teslim tarihi) burada tekrarlanmaz.
 */
export interface AttributeSchemaSeed {
  categorySlug: string;
  version: number;
  fields: {
    key: string;
    label: LocalizedText;
    type: AttributeFieldType;
    required?: boolean;
    options?: { value: string; label: LocalizedText }[];
    unit?: LocalizedText;
    description?: LocalizedText;
  }[];
}

export const ATTRIBUTE_SCHEMA_SEEDS: AttributeSchemaSeed[] = [
  {
    categorySlug: 'madeni-yag-kimya',
    version: 1,
    fields: [
      {
        key: 'productType',
        label: { tr: 'Ürün tipi', en: 'Product type' },
        type: 'enum',
        required: true,
        options: [
          { value: 'engineOil', label: { tr: 'Motor yağı', en: 'Engine oil' } },
          { value: 'hydraulicOil', label: { tr: 'Hidrolik yağ', en: 'Hydraulic oil' } },
          { value: 'gearOil', label: { tr: 'Dişli yağı', en: 'Gear oil' } },
          { value: 'industrialOil', label: { tr: 'Endüstriyel yağ', en: 'Industrial oil' } },
          {
            value: 'transmissionOil',
            label: { tr: 'Transmisyon yağı', en: 'Transmission fluid' },
          },
          { value: 'grease', label: { tr: 'Gres', en: 'Grease' } },
        ],
      },
      {
        key: 'viscosity',
        label: { tr: 'Viskozite', en: 'Viscosity' },
        type: 'string',
        required: true,
        description: { tr: 'Örn. 5W-30, ISO VG 46', en: 'e.g. 5W-30, ISO VG 46' },
      },
      {
        key: 'standard',
        label: { tr: 'Standart / spesifikasyon', en: 'Standard / specification' },
        type: 'string',
        description: {
          tr: 'Örn. API SN, ACEA C3, DIN 51524',
          en: 'e.g. API SN, ACEA C3, DIN 51524',
        },
      },
      {
        key: 'packagingType',
        label: { tr: 'Ambalaj', en: 'Packaging' },
        type: 'enum',
        required: true,
        options: [
          { value: 'drum', label: { tr: 'Varil', en: 'Drum' } },
          { value: 'pail', label: { tr: 'Bidon', en: 'Pail' } },
          { value: 'ibc', label: { tr: 'IBC', en: 'IBC tote' } },
          { value: 'bulk', label: { tr: 'Dökme', en: 'Bulk' } },
        ],
      },
      {
        key: 'invoiceRequired',
        label: { tr: 'Fatura gerekli', en: 'Invoice required' },
        type: 'boolean',
      },
      {
        key: 'alternativeBrandAllowed',
        label: { tr: 'Alternatif marka kabul edilir', en: 'Alternative brands accepted' },
        type: 'boolean',
      },
    ],
  },
  {
    categorySlug: 'elektronik-komponent',
    version: 1,
    fields: [
      {
        key: 'componentType',
        label: { tr: 'Komponent tipi', en: 'Component type' },
        type: 'enum',
        required: true,
        options: [
          { value: 'passive', label: { tr: 'Pasif komponent', en: 'Passive component' } },
          { value: 'activeIc', label: { tr: 'Aktif komponent / IC', en: 'Active component / IC' } },
          { value: 'microcontroller', label: { tr: 'Mikrodenetleyici', en: 'Microcontroller' } },
          { value: 'sensor', label: { tr: 'Sensör', en: 'Sensor' } },
          { value: 'connector', label: { tr: 'Konnektör', en: 'Connector' } },
          { value: 'pcb', label: { tr: 'PCB', en: 'PCB' } },
        ],
      },
      {
        key: 'manufacturerPartNumber',
        label: { tr: 'Üretici parça numarası (MPN)', en: 'Manufacturer part number (MPN)' },
        type: 'string',
        required: true,
        description: {
          tr: 'Muadil kabul ediyorsanız açıklamaya not düşün',
          en: 'If equivalent parts are acceptable, mention it in the description',
        },
      },
      {
        key: 'mountingType',
        label: { tr: 'Montaj tipi', en: 'Mounting type' },
        type: 'enum',
        options: [
          { value: 'smd', label: { tr: 'SMD', en: 'SMD' } },
          { value: 'tht', label: { tr: 'THT', en: 'THT' } },
          { value: 'module', label: { tr: 'Modül', en: 'Module' } },
        ],
      },
      {
        key: 'tolerancePercent',
        label: { tr: 'Tolerans', en: 'Tolerance' },
        type: 'decimal',
        unit: '%',
      },
      {
        key: 'operatingVoltage',
        label: { tr: 'Çalışma gerilimi', en: 'Operating voltage' },
        type: 'string',
        unit: 'V',
      },
      {
        key: 'rohsCompliant',
        label: { tr: 'RoHS uyumlu olmalı', en: 'Must be RoHS compliant' },
        type: 'boolean',
      },
    ],
  },
  {
    categorySlug: 'gida-icecek-toptan',
    version: 1,
    fields: [
      {
        key: 'storageCondition',
        label: { tr: 'Saklama koşulu', en: 'Storage condition' },
        type: 'enum',
        required: true,
        options: [
          { value: 'ambient', label: { tr: 'Kuru gıda', en: 'Dry goods' } },
          { value: 'chilled', label: { tr: 'Soğuk zincir (0-4 °C)', en: 'Chilled (0-4 °C)' } },
          { value: 'frozen', label: { tr: 'Donuk (-18 °C)', en: 'Frozen (-18 °C)' } },
        ],
      },
      {
        key: 'minShelfLifeDays',
        label: { tr: 'Asgari raf ömrü', en: 'Minimum shelf life' },
        type: 'number',
        required: true,
        unit: { tr: 'gün', en: 'days' },
        description: {
          tr: 'Teslimat tarihinden itibaren kalan süre',
          en: 'Remaining shelf life from the delivery date',
        },
      },
      {
        key: 'packagingType',
        label: { tr: 'Ambalaj', en: 'Packaging' },
        type: 'enum',
        options: [
          { value: 'case', label: { tr: 'Koli', en: 'Case' } },
          { value: 'sack', label: { tr: 'Çuval', en: 'Sack' } },
          { value: 'pallet', label: { tr: 'Palet', en: 'Pallet' } },
          { value: 'crate', label: { tr: 'Kasa', en: 'Crate' } },
          { value: 'bulk', label: { tr: 'Dökme', en: 'Bulk' } },
        ],
      },
      {
        key: 'certification',
        label: { tr: 'Sertifika', en: 'Certification' },
        type: 'enum',
        options: [
          { value: 'any', label: { tr: 'Fark etmez', en: 'No preference' } },
          { value: 'halal', label: { tr: 'Helal', en: 'Halal' } },
          { value: 'iso22000', label: { tr: 'ISO 22000', en: 'ISO 22000' } },
          { value: 'organic', label: { tr: 'Organik', en: 'Organic' } },
        ],
      },
      {
        key: 'earliestProductionDate',
        label: { tr: 'En erken üretim tarihi', en: 'Earliest production date' },
        type: 'date',
      },
    ],
  },
];
