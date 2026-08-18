import {
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Camera,
  Car,
  CircuitBoard,
  Cog,
  Droplets,
  Dumbbell,
  Gamepad2,
  Gem,
  Hammer,
  Heart,
  Leaf,
  Monitor,
  Music,
  PawPrint,
  Plane,
  Shield,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Truck,
  UtensilsCrossed,
  WashingMachine,
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
  utensils: UtensilsCrossed,
  cpu: CircuitBoard,
  shirt: Shirt,
  car: Car,
  building: Building2,
  droplet: Droplets,
  cog: Cog,
  briefcase: BriefcaseBusiness,
  sofa: Sofa,
  leaf: Leaf,
  heart: Heart,
  truck: Truck,
  bolt: Zap,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  wrench: Wrench,
  monitor: Monitor,
  smartphone: Smartphone,
  washer: WashingMachine,
  camera: Camera,
  baby: Baby,
  gamepad: Gamepad2,
  book: BookOpen,
  paw: PawPrint,
  gem: Gem,
  music: Music,
  hammer: Hammer,
  shield: Shield,
  plane: Plane,
  // Eski satıcı tohum ikonları (pasif kategoriler / geriye uyum)
  pipe: Droplets,
  wind: Zap,
  flame: Zap,
  window: Building2,
  roller: Sparkles,
  key: Wrench,
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
