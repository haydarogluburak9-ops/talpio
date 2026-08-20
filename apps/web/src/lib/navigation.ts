export interface NavItem {
  href: string;
  labelKey: string;
}

/** Üst menü (giriş sonrası / genel). */
export const primaryNav: NavItem[] = [
  { href: '/akis', labelKey: 'nav.feed' },
  { href: '/kesfet', labelKey: 'nav.discover' },
  { href: '/kategoriler', labelKey: 'nav.categories' },
  { href: '/tedarik', labelKey: 'nav.newSupplyRequest' },
  { href: '/nasil-calisir', labelKey: 'nav.howItWorks' },
  { href: '/satici/panel', labelKey: 'nav.myBusiness' },
];

export const footerNav: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: 'nav.categories',
    items: [
      { href: '/kategoriler', labelKey: 'nav.categories' },
      { href: '/nasil-calisir', labelKey: 'nav.howItWorks' },
    ],
  },
  {
    titleKey: 'nav.legal',
    items: [
      { href: '/yasal/gizlilik', labelKey: 'nav.privacy' },
      { href: '/yasal/kullanim-kosullari', labelKey: 'nav.terms' },
      { href: '/yasal/kvkk', labelKey: 'nav.gdpr' },
    ],
  },
];
