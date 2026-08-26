import type { LocalizedText } from './common';

/**
 * Kategoriye özel kolon seti yerine JSON şema tanımı.
 * Dikey alanlar (viskozite, marka vb.) burada tanımlanır; Prisma tablosu yok.
 */
export type AttributeFieldType = 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'decimal';

/**
 * Enum seçeneği. `value` talebin `specifications` alanına yazılan, dilden
 * bağımsız sabittir; `label` yalnızca ekranda görünür.
 */
export interface AttributeFieldOption {
  value: string;
  label: LocalizedText;
}

export interface AttributeFieldDefinition {
  key: string;
  label: LocalizedText;
  type: AttributeFieldType;
  required?: boolean;
  options?: readonly AttributeFieldOption[];
  unit?: LocalizedText;
  description?: LocalizedText;
}

/**
 * `attribute_schemas.schema` sütununda duran ham biçim. Sütun şemasız JSON
 * olduğu için eski satırlar seçenekleri düz string olarak taşıyabilir; o
 * durumda saklanan değer ile etiket aynıdır.
 */
export type StoredAttributeFieldOption = string | AttributeFieldOption;

export interface StoredAttributeFieldDefinition extends Omit<AttributeFieldDefinition, 'options'> {
  options?: readonly StoredAttributeFieldOption[];
}

export interface AttributeSchemaDefinition {
  version: number;
  fields: readonly StoredAttributeFieldDefinition[];
}

export interface AttributeSchemaRecord {
  id: string;
  categoryId: string;
  version: number;
  schema: AttributeSchemaDefinition;
  isActive: boolean;
}

/**
 * Kategori alan şeması okuma yanıtı.
 *
 * Kategorilerin çoğunda şema yoktur; bu normaldir ve hata değildir. O durumda
 * `version` null, `fields` boş döner ve form yalnızca ortak alanlarını gösterir.
 */
export interface CategoryAttributeSchema {
  categoryId: string;
  version: number | null;
  fields: AttributeFieldDefinition[];
}
