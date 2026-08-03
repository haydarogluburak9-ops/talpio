/**
 * UstaPilot tasarım belirteçleri — mobil karşılığı.
 *
 * Değerler `packages/ui/src/theme.css` ile birebir aynıdır. Görsel dil web ile
 * ortak, teknik uygulama platforma özgüdür: CSS değişkenleri React Native'de
 * çalışmadığı için palet burada TypeScript sabitleri olarak tutulur.
 */

export const palette = {
  /* Logo laciverti; 700 kelime markası, 900 koyu banner zemini. */
  brand: {
    50: '#eff4fa',
    100: '#dae7f4',
    200: '#b5cde7',
    300: '#86aad4',
    400: '#5484bb',
    500: '#30629c',
    600: '#1e4c7c',
    700: '#14375a',
    800: '#0a2743',
    900: '#021b32',
    950: '#01101f',
  },
  /* Logo turuncusu; 500 konum işaretinin rengi. */
  accent: {
    50: '#fff4e6',
    100: '#ffe4c2',
    200: '#ffc688',
    300: '#ffa64d',
    400: '#fd9522',
    500: '#fc8c0a',
    600: '#de7205',
    700: '#b35b06',
  },
  success: { 50: '#ecfdf3', 500: '#16a34a', 700: '#15803d' },
  warning: { 50: '#fefce8', 500: '#eab308', 700: '#a16207' },
  danger: { 50: '#fef2f2', 500: '#dc2626', 700: '#b91c1c' },
  info: { 50: '#eff9ff', 500: '#0ea5e9', 700: '#0369a1' },
} as const;

/**
 * Anlamsal renk kümesi. Açık ve koyu tema aynı anahtarlara sahiptir; eksik bir
 * anahtar derleme hatası verir. Değerler `string` olarak tiplenir, aksi hâlde
 * koyu tema açık temanın birebir renk kodlarını talep ederdi.
 */
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
  /*
   * Kendi soluk yüzeyi üzerine yazılan metin için koyulaştırılmış tonlar.
   * Açık temada 500 tonu soluk zeminde okunmaz; web'deki `text-*-700`
   * kullanımının mobil karşılığıdır.
   */
  accentOnSurface: string;
  successOnSurface: string;
  warningOnSurface: string;
  dangerOnSurface: string;
  infoOnSurface: string;
}

export const lightColors: ThemeColors = {
  background: '#f5f7fa',
  surface: '#ffffff',
  surfaceMuted: '#eef2f7',
  foreground: '#0a2038',
  foregroundMuted: '#55697f',
  border: '#dfe5ed',
  brand: palette.brand[600],
  brandStrong: palette.brand[700],
  onBrand: '#ffffff',
  accent: palette.accent[500],
  accentSurface: palette.accent[50],
  onAccent: palette.brand[900],
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
  background: '#02101d',
  surface: '#05192e',
  surfaceMuted: '#0b2540',
  foreground: '#e9eef5',
  foregroundMuted: '#93a6bd',
  border: '#16304e',
  brand: palette.brand[300],
  brandStrong: palette.brand[200],
  onBrand: palette.brand[950],
  accent: palette.accent[400],
  accentSurface: 'rgba(252, 140, 10, 0.16)',
  onAccent: palette.brand[950],
  success: palette.success[500],
  successSurface: 'rgba(22, 163, 74, 0.16)',
  warning: palette.warning[500],
  warningSurface: 'rgba(234, 179, 8, 0.16)',
  danger: palette.danger[500],
  dangerSurface: 'rgba(220, 38, 38, 0.16)',
  info: palette.info[500],
  infoSurface: 'rgba(14, 165, 233, 0.16)',
  // Koyu temada yüzeyler saydam ve karanlık; 500 tonu zaten yeterli kontrastta.
  accentOnSurface: palette.accent[300],
  successOnSurface: palette.success[500],
  warningOnSurface: palette.warning[500],
  dangerOnSurface: palette.danger[500],
  infoOnSurface: palette.info[500],
};

/** 4px tabanlı boşluk ölçeği; web'deki Tailwind ölçeğiyle aynı adımlar. */
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
  control: 10,
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

/** Dokunmatik hedeflerin erişilebilirlik alt sınırı. */
export const MIN_TOUCH_TARGET = 44;
