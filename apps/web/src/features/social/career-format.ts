const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function monthLabel(month: number | null | undefined, locale: string): string {
  if (!month || month < 1 || month > 12) return '';
  const labels = locale.startsWith('tr') ? MONTHS_TR : MONTHS_EN;
  return labels[month - 1] ?? '';
}

function formatPoint(
  year: number,
  month: number | null | undefined,
  locale: string,
): string {
  const m = monthLabel(month, locale);
  return m ? `${m} ${year}` : String(year);
}

export function formatCareerPeriod(
  startYear: number,
  startMonth: number | null | undefined,
  endYear: number | null | undefined,
  endMonth: number | null | undefined,
  isCurrent: boolean,
  locale: string,
  presentLabel: string,
): string {
  const start = formatPoint(startYear, startMonth, locale);
  const end = isCurrent
    ? presentLabel
    : endYear
      ? formatPoint(endYear, endMonth, locale)
      : presentLabel;
  return `${start} – ${end}`;
}
