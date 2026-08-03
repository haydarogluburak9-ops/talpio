import {
  Building2,
  Droplets,
  Hammer,
  Key,
  Leaf,
  Monitor,
  PaintRoller,
  Shield,
  Sparkles,
  Truck,
  WashingMachine,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Veritabanındaki `iconKey` alanını arayüzün ikon kümesine eşler.
 * Bilinmeyen anahtarlar için nötr bir ikona düşülür; kategori eklendiğinde
 * arayüz bozulmaz.
 */
const iconMap: Record<string, LucideIcon> = {
  pipe: Droplets,
  bolt: Zap,
  wind: Wind,
  flame: Wind,
  window: Building2,
  roller: PaintRoller,
  hammer: Hammer,
  sparkles: Sparkles,
  truck: Truck,
  washer: WashingMachine,
  key: Key,
  building: Building2,
  leaf: Leaf,
  shield: Shield,
  monitor: Monitor,
};

export function CategoryIcon({
  iconKey,
  className,
}: {
  iconKey: string | null | undefined;
  className?: string;
}) {
  const Icon = (iconKey ? iconMap[iconKey] : undefined) ?? Wrench;
  return <Icon className={className} aria-hidden />;
}
