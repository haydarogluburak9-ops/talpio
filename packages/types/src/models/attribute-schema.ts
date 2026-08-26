/**
 * Kategoriye özel kolon seti yerine JSON şema tanımı.
 * Dikey alanlar (viskozite, marka vb.) burada tanımlanır; Prisma tablosu yok.
 */
export type AttributeFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'date'
  | 'decimal';

export interface AttributeFieldDefinition {
  key: string;
  label: string;
  type: AttributeFieldType;
  required?: boolean;
  options?: readonly string[];
  unit?: string;
  description?: string;
}

export interface AttributeSchemaDefinition {
  version: number;
  fields: readonly AttributeFieldDefinition[];
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
