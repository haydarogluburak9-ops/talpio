export interface NavItem {
  href: string;
  labelKey: string;
}

/** Üst menü. Etiketler çeviri kataloğundan çözülür. */
export const primaryNav: NavItem[] = [
  { href: '/kategoriler', labelKey: 'nav.categories' },
  { href: '/nasil-calisir', labelKey: 'nav.howItWorks' },
  { href: '/usta-ol', labelKey: 'nav.becomeProvider' },
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
    titleKey: 'nav.becomeProvider',
    items: [{ href: '/usta-ol', labelKey: 'nav.becomeProvider' }],
  },
];
