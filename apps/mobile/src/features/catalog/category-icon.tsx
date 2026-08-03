import { Ionicons } from '@expo/vector-icons';

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Veritabanındaki `iconKey` alanını Ionicons kümesine eşler. Web'deki
 * `category-icon.tsx` ile aynı anahtarları kullanır; yalnızca ikon kümesi
 * platforma göre değişir. Bilinmeyen anahtarlarda nötr ikona düşülür, böylece
 * yeni kategori eklendiğinde arayüz bozulmaz.
 */
const ICON_MAP: Record<string, IoniconName> = {
  pipe: 'water-outline',
  bolt: 'flash-outline',
  wind: 'snow-outline',
  flame: 'flame-outline',
  window: 'browsers-outline',
  roller: 'color-fill-outline',
  hammer: 'hammer-outline',
  sparkles: 'sparkles-outline',
  truck: 'car-outline',
  washer: 'cube-outline',
  key: 'key-outline',
  building: 'business-outline',
  leaf: 'leaf-outline',
  shield: 'shield-checkmark-outline',
  monitor: 'desktop-outline',
};

export function categoryIconName(iconKey: string | null | undefined): IoniconName {
  return (iconKey ? ICON_MAP[iconKey] : undefined) ?? 'construct-outline';
}

export function CategoryIcon({
  iconKey,
  size = 24,
  color,
}: {
  iconKey: string | null | undefined;
  size?: number;
  color: string;
}) {
  return <Ionicons name={categoryIconName(iconKey)} size={size} color={color} />;
}
