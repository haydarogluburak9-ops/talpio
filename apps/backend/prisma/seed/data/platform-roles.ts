export interface PlatformRoleSeed {
  code: string;
  name: string;
  description: string;
  permissions: readonly string[];
}

const SOCIAL_PERMS = [
  'social.profile.manage',
  'social.post.create',
  'social.interact',
  'social.report',
] as const;

const BUYER_PERMS = [
  'request.create',
  'request.read.own',
  'request.update.own',
  'request.cancel.own',
  'request.offer.accept',
  ...SOCIAL_PERMS,
] as const;

const SUPPLIER_PERMS = [
  'request.read.matched',
  'request.offer.create',
  'request.offer.read.own',
  'request.offer.update.own',
  'supplier.profile.manage',
  ...SOCIAL_PERMS,
] as const;

export const PLATFORM_ROLE_SEEDS: PlatformRoleSeed[] = [
  {
    code: 'buyer',
    name: 'Alıcı',
    description: 'Talep oluşturur ve teklif kabul eder',
    permissions: BUYER_PERMS,
  },
  {
    code: 'supplier',
    name: 'Tedarikçi',
    description: 'Eşleşen taleplere teklif verir',
    permissions: SUPPLIER_PERMS,
  },
  {
    code: 'service_provider',
    name: 'Hizmet sağlayıcı',
    description: 'Hizmet ve tedarik taleplerine yanıt verir',
    permissions: SUPPLIER_PERMS,
  },
  {
    code: 'manufacturer',
    name: 'Üretici',
    description: 'Üretim / tedarik teklifi verir',
    permissions: [
      'request.read.matched',
      'request.offer.create',
      'request.offer.read.own',
      'supplier.profile.manage',
    ],
  },
  {
    code: 'distributor',
    name: 'Distribütör',
    description: 'Dağıtım kanalı tedarikçisi',
    permissions: [
      'request.read.matched',
      'request.offer.create',
      'request.offer.read.own',
      'supplier.profile.manage',
    ],
  },
  {
    code: 'wholesaler',
    name: 'Toptancı',
    description: 'Toptan tedarik teklifi verir',
    permissions: ['request.read.matched', 'request.offer.create', 'supplier.profile.manage'],
  },
  {
    code: 'dealer',
    name: 'Bayi',
    description: 'Bayi kanalı tedarikçisi',
    permissions: ['request.read.matched', 'request.offer.create', 'supplier.profile.manage'],
  },
  {
    code: 'enterprise_member',
    name: 'Kurum üyesi',
    description: 'Kurumsal organizasyon üyesi',
    permissions: ['request.create', 'request.read.own', 'crm.customer.manage'],
  },
  {
    code: 'enterprise_admin',
    name: 'Kurum yöneticisi',
    description: 'Kurumsal organizasyon yöneticisi',
    permissions: [
      ...BUYER_PERMS,
      'crm.customer.manage',
      'workorder.manage',
      'campaign.create',
    ],
  },
  {
    code: 'platform_admin',
    name: 'Platform yöneticisi',
    description: 'Talep moderasyonu ve platform yönetimi',
    permissions: [
      'admin.request.moderate',
      'admin.social.moderate',
      'request.read.own',
      'request.read.matched',
    ],
  },
  {
    code: 'support_agent',
    name: 'Destek temsilcisi',
    description: 'Destek ve talep inceleme',
    permissions: ['admin.request.moderate'],
  },
];

export const LEGACY_ROLE_PLATFORM_MAP: Record<string, string> = {
  CUSTOMER: 'buyer',
  PROVIDER: 'service_provider',
  SUPPORT: 'support_agent',
  ADMIN: 'platform_admin',
  SUPER_ADMIN: 'platform_admin',
};
