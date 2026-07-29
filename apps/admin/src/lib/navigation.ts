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
  /** Faz planında henüz uygulanmamış ekranlar için. */
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
      { label: 'Kullanıcılar', href: '/users', icon: Users, planned: true },
      { label: 'Ustalar', href: '/masters', icon: Building2, planned: true },
      { label: 'Usta doğrulamaları', href: '/verifications', icon: BadgeCheck, planned: true },
    ],
  },
  {
    title: 'İşler',
    items: [
      { label: 'İş talepleri', href: '/job-requests', icon: ClipboardList, planned: true },
      { label: 'Teklifler', href: '/offers', icon: Handshake, planned: true },
      { label: 'Yorumlar', href: '/reviews', icon: Star, planned: true },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { label: 'Kategoriler', href: '/categories', icon: LayoutGrid, planned: true },
      { label: 'Konumlar', href: '/locations', icon: MapPin, planned: true },
    ],
  },
  {
    title: 'Finans',
    items: [
      { label: 'Ödemeler', href: '/payments', icon: CreditCard, planned: true },
      { label: 'İşlemler', href: '/transactions', icon: Receipt, planned: true },
      { label: 'Komisyonlar', href: '/commissions', icon: Percent, planned: true },
      { label: 'Abonelikler', href: '/subscriptions', icon: Wallet, planned: true },
    ],
  },
  {
    title: 'Destek',
    items: [
      { label: 'Destek talepleri', href: '/support', icon: LifeBuoy, planned: true },
      { label: 'Şikâyetler', href: '/complaints', icon: MessageSquareWarning, planned: true },
    ],
  },
  {
    title: 'Büyüme',
    items: [
      { label: 'Kampanyalar', href: '/promotions', icon: Tag, planned: true },
      { label: 'Bildirimler', href: '/notifications', icon: Bell, planned: true },
      { label: 'Raporlar', href: '/reports', icon: TrendingUp, planned: true },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Sistem ayarları', href: '/settings', icon: Settings, planned: true },
      { label: 'Yetkiler', href: '/settings/roles', icon: ShieldCheck, planned: true },
      { label: 'Denetim kayıtları', href: '/audit-logs', icon: FileText, planned: true },
    ],
  },
];
