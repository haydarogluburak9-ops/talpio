import { DocumentType } from '@talpio/types';

/**
 * Ülkeye göre istenen kuruluş belgesi paketi.
 *
 * İlk sürümde üç evrensel tür yeter: yetkili kimliği, vergi kaydı ve şirket
 * tescili. `CRAFTSMANSHIP_CERTIFICATE` mevcut şemada ticaret siciline karşılık
 * geliyor; yeni bir enum değeri eklemek, henüz kullanılmayan bir sütun
 * anlamına gelirdi.
 *
 * Ülke kodu tanımsız veya listede yoksa varsayılan paket uygulanır: her
 * ülkede en az vergi kaydı ve tescil belgesi istenir.
 */
const DEFAULT_PACK: readonly DocumentType[] = [
  DocumentType.IDENTITY,
  DocumentType.TAX_CERTIFICATE,
  DocumentType.CRAFTSMANSHIP_CERTIFICATE,
];

const COUNTRY_PACKS: Record<string, readonly DocumentType[]> = {
  TR: DEFAULT_PACK,
  DE: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
  AT: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
  FR: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
  ES: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
  US: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
  GB: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
  AE: [DocumentType.TAX_CERTIFICATE, DocumentType.CRAFTSMANSHIP_CERTIFICATE],
};

export function requiredIncorporationDocuments(
  countryCode?: string | null,
): readonly DocumentType[] {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return DEFAULT_PACK;
  return COUNTRY_PACKS[code] ?? DEFAULT_PACK;
}
