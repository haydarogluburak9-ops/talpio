/** Oran yoksa (payda 0) sahte %0 basılmaz. */
export function ratioPercent(part: number, total: number): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.round((Math.max(0, part) / total) * 100));
}

export function toFiniteNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
