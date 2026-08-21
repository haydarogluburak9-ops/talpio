export interface NavItem {
  href: string;
  labelKey: string;
}

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
