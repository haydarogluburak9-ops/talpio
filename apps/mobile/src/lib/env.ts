/**
 * Mobil ortam değişkenleri.
 *
 * ÖNEMLİ: Expo'da `EXPO_PUBLIC_` ön ekli değişkenler derleme sırasında pakete
 * gömülür ve cihazdan okunabilir. Bu yüzden yalnızca herkese açık olabilecek
 * değerler burada tutulur. Gizli anahtarlar backend'de kalır.
 */
function required(value: string | undefined, name: string, fallback: string): string {
  if (value && value.length > 0) return value;

  if (__DEV__) return fallback;

  throw new Error(`${name} tanımlı değil. apps/mobile/.env.example dosyasına bakın.`);
}

export const env = {
  apiUrl: required(
    process.env.EXPO_PUBLIC_API_URL,
    'EXPO_PUBLIC_API_URL',
    // Android emülatörü ana makineye 10.0.2.2 üzerinden ulaşır.
    'http://localhost:3000/api/v1',
  ),
  defaultLocale: process.env.EXPO_PUBLIC_DEFAULT_LOCALE ?? 'tr',
} as const;
