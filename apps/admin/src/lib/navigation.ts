import {
  BadgeCheck,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  Flag,
  Gauge,
  Handshake,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  MessageSquareWarning,
  Package,
  Percent,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  labelKey: string;
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
  titleKey: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titleKey: 'admin.groupOverview',
    items: [{ labelKey: 'admin.dashboard', href: '/dashboard', icon: Gauge }],
  },
  {
    titleKey: 'admin.groupUsers',
    items: [
      { labelKey: 'admin.users', href: '/users', icon: Users },
      { labelKey: 'admin.businesses', href: '/masters', icon: Building2 },
      { labelKey: 'admin.verifications', href: '/verifications', icon: BadgeCheck },
    ],
  },
  {
    titleKey: 'admin.groupWork',
    items: [
      { labelKey: 'admin.jobRequests', href: '/job-requests', icon: ClipboardList },
      { labelKey: 'admin.commerceRequests', href: '/commerce-requests', icon: Package },
      { labelKey: 'admin.offers', href: '/offers', icon: Handshake },
      { labelKey: 'admin.orders', href: '/orders', icon: ShoppingBag },
      { labelKey: 'admin.reviews', href: '/reviews', icon: Star },
    ],
  },
  {
    titleKey: 'admin.groupCatalog',
    items: [
      { labelKey: 'admin.categories', href: '/categories', icon: LayoutGrid },
      { labelKey: 'admin.locations', href: '/locations', icon: MapPin },
    ],
  },
  {
    titleKey: 'admin.groupFinance',
    items: [
      { labelKey: 'admin.payments', href: '/payments', icon: CreditCard },
      { labelKey: 'admin.transactions', href: '/transactions', icon: Receipt },
      { labelKey: 'admin.commissions', href: '/commissions', icon: Percent },
      { labelKey: 'admin.subscriptions', href: '/subscriptions', icon: Wallet },
    ],
  },
  {
    titleKey: 'admin.groupSupport',
    items: [
      { labelKey: 'admin.supportTickets', href: '/support', icon: LifeBuoy },
      { labelKey: 'admin.complaints', href: '/complaints', icon: MessageSquareWarning },
    ],
  },
  {
    titleKey: 'admin.groupGrowth',
    items: [
      { labelKey: 'admin.campaigns', href: '/promotions', icon: Tag },
      { labelKey: 'admin.moderation', href: '/moderation', icon: ShieldAlert },
      { labelKey: 'admin.fraud', href: '/fraud', icon: Flag },
      { labelKey: 'admin.aiUsage', href: '/ai-usage', icon: Sparkles },
      { labelKey: 'admin.notifications', href: '/notifications', icon: Bell },
      { labelKey: 'admin.reports', href: '/reports', icon: TrendingUp },
    ],
  },
  {
    titleKey: 'admin.groupSystem',
    items: [
      { labelKey: 'admin.systemHealth', href: '/system-health', icon: Gauge },
      { labelKey: 'admin.backupStatus', href: '/backup', icon: FileText },
      { labelKey: 'admin.settings', href: '/settings', icon: Settings },
      { labelKey: 'admin.roles', href: '/settings/roles', icon: ShieldCheck },
      { labelKey: 'admin.audit', href: '/audit-logs', icon: FileText },
      { labelKey: 'admin.account', href: '/account', icon: UserCog },
    ],
  },
];
