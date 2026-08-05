import {
  BadgeCheck,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  Handshake,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  MessageSquareWarning,
  Percent,
  Receipt,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Sayfa mevcut ancak API ucu henüz bağlı değil. Bağlantı gezilebilir kalır:
   * ekran modülün kapsamını açıklar, bu yüzden erişimi engellemek bilgi kaybı
   * olurdu.
   */
  planned?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Genel',
    items: [{ label: 'Panel', href: '/dashboard', icon: Gauge }],
  },
  {
    title: 'Kullanıcılar',
    items: [
      { label: 'Kullanıcılar', href: '/users', icon: Users },
      { label: 'Ustalar', href: '/masters', icon: Building2 },
      { label: 'Usta doğrulamaları', href: '/verifications', icon: BadgeCheck },
    ],
  },
  {
    title: 'İşler',
    items: [
      { label: 'İş talepleri', href: '/job-requests', icon: ClipboardList },
      { label: 'Teklifler', href: '/offers', icon: Handshake },
      { label: 'Siparişler', href: '/orders', icon: ShoppingBag },
      { label: 'Yorumlar', href: '/reviews', icon: Star, planned: true },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { label: 'Kategoriler', href: '/categories', icon: LayoutGrid },
      { label: 'Konumlar', href: '/locations', icon: MapPin },
    ],
  },
  {
    title: 'Finans',
    items: [
      { label: 'Ödemeler', href: '/payments', icon: CreditCard },
      { label: 'İşlemler', href: '/transactions', icon: Receipt },
      { label: 'Komisyonlar', href: '/commissions', icon: Percent },
      { label: 'Abonelikler', href: '/subscriptions', icon: Wallet, planned: true },
    ],
  },
  {
    title: 'Destek',
    items: [
      { label: 'Destek talepleri', href: '/support', icon: LifeBuoy },
      { label: 'Şikâyetler', href: '/complaints', icon: MessageSquareWarning },
    ],
  },
  {
    title: 'Büyüme',
    items: [
      { label: 'Kampanyalar', href: '/promotions', icon: Tag, planned: true },
      { label: 'Bildirimler', href: '/notifications', icon: Bell },
      { label: 'Raporlar', href: '/reports', icon: TrendingUp, planned: true },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Sistem ayarları', href: '/settings', icon: Settings, planned: true },
      { label: 'Yetkiler', href: '/settings/roles', icon: ShieldCheck, planned: true },
      { label: 'Denetim kayıtları', href: '/audit-logs', icon: FileText },
    ],
  },
];
