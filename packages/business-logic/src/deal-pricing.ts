/**
 * Fırsat indirim yüzdesi. LLM hesaplamaz; tam sayı kuruş üzerinden.
 */

export function computeDiscountPercent(
  listPriceMinor: number | null | undefined,
  dealPriceMinor: number | null | undefined,
): number | null {
  if (
    listPriceMinor == null ||
    dealPriceMinor == null ||
    !Number.isFinite(listPriceMinor) ||
    !Number.isFinite(dealPriceMinor) ||
    listPriceMinor <= 0
  ) {
    return null;
  }

  const raw = ((listPriceMinor - dealPriceMinor) / listPriceMinor) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
