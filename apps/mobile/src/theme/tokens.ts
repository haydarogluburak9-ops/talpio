/**
 * Talpio tasarım belirteçleri — mobil karşılığı.
 *
 * Değerler `packages/ui/src/theme.css` ile birebir aynıdır.
 */

export const palette = {
  brand: {
    50: '#f3f6f9',
    100: '#e4ebf2',
    200: '#c5d3e0',
    300: '#8fa8c0',
    400: '#5a7a98',
    500: '#355574',
    600: '#1b263b',
    700: '#152233',
    800: '#111c2b',
    900: '#0d1b2a',
    950: '#07111f',
  },
  accent: {
    50: '#fff4ec',
    100: '#ffe4d1',
    200: '#ffc7a3',
    300: '#ffa56b',
    400: '#ff8c42',
    500: '#ff6a00',
    600: '#e85f00',
    700: '#c24f00',
  },
  success: { 50: '#ecfdf3', 500: '#16a34a', 700: '#15803d' },
  warning: { 50: '#fffbeb', 500: '#f59e0b', 700: '#b45309' },
  danger: { 50: '#fef2f2', 500: '#dc2626', 700: '#b91c1c' },
  info: { 50: '#eff9ff', 500: '#0ea5e9', 700: '#0369a1' },
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  foreground: string;
  foregroundMuted: string;
  border: string;
  brand: string;
  brandStrong: string;
  onBrand: string;
  accent: string;
  accentSurface: string;
  onAccent: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  danger: string;
  dangerSurface: string;
  info: string;
  infoSurface: string;
  accentOnSurface: string;
  successOnSurface: string;
  warningOnSurface: string;
  dangerOnSurface: string;
  infoOnSurface: string;
}

export const lightColors: ThemeColors = {
  background: '#f7f8fa',
  surface: '#ffffff',
  surfaceMuted: '#eef1f5',
  foreground: '#111827',
  foregroundMuted: '#667085',
  border: '#e8ebf0',
  brand: palette.brand[600],
  brandStrong: palette.brand[900],
  onBrand: '#ffffff',
  accent: palette.accent[500],
  accentSurface: palette.accent[50],
  onAccent: '#ffffff',
  success: palette.success[500],
  successSurface: palette.success[50],
  warning: palette.warning[500],
  warningSurface: palette.warning[50],
  danger: palette.danger[500],
  dangerSurface: palette.danger[50],
  info: palette.info[500],
  infoSurface: palette.info[50],
  accentOnSurface: palette.accent[700],
  successOnSurface: palette.success[700],
  warningOnSurface: palette.warning[700],
  dangerOnSurface: palette.danger[700],
  infoOnSurface: palette.info[700],
};

export const darkColors: ThemeColors = {
  background: '#07111f',
  surface: '#0d1b2a',
  surfaceMuted: '#111f30',
  foreground: '#f3f6f9',
  foregroundMuted: '#93a4b8',
  border: '#1e2f44',
  brand: palette.brand[300],
  brandStrong: palette.brand[200],
  onBrand: palette.brand[950],
  accent: palette.accent[400],
  accentSurface: 'rgba(255, 106, 0, 0.16)',
  onAccent: '#ffffff',
  success: palette.success[500],
  successSurface: 'rgba(22, 163, 74, 0.16)',
  warning: palette.warning[500],
  warningSurface: 'rgba(245, 158, 11, 0.16)',
  danger: palette.danger[500],
  dangerSurface: 'rgba(220, 38, 38, 0.16)',
  info: palette.info[500],
  infoSurface: 'rgba(14, 165, 233, 0.16)',
  accentOnSurface: palette.accent[300],
  successOnSurface: palette.success[500],
  warningOnSurface: palette.warning[500],
  dangerOnSurface: palette.danger[500],
  infoOnSurface: palette.info[500],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  control: 12,
  card: 16,
  pill: 999,
} as const;

export const typography = {
  displayLg: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  displaySm: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
} as const;

export const MIN_TOUCH_TARGET = 44;
