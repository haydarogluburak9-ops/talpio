import { UserRole } from '../../../src/generated/prisma/enums';

export interface DemoAccount {
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  /** Usta hesabı için ek profil bilgileri. */
  provider?: {
    businessName: string;
    about: string;
    experienceYears: number;
    categorySlug: string;
    cityName: string;
  };
}

/**
 * Yalnızca geliştirme ve demo ortamlarında oluşturulur. Parola tek bir ortam
 * değişkeninden gelir ve hiçbir zaman koda gömülmez.
 */
export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    email: 'admin@ustapilot.com',
    fullName: 'Sistem Yöneticisi',
    phone: '+905320000001',
    role: UserRole.SUPER_ADMIN,
  },
  {
    email: 'destek@ustapilot.com',
    fullName: 'Destek Ekibi',
    phone: '+905320000002',
    role: UserRole.SUPPORT,
  },
  {
    email: 'musteri@ustapilot.com',
    fullName: 'Ayşe Yılmaz',
    phone: '+905320000003',
    role: UserRole.CUSTOMER,
  },
  {
    email: 'usta@ustapilot.com',
    fullName: 'Mehmet Demir',
    phone: '+905320000004',
    role: UserRole.PROVIDER,
    provider: {
      businessName: 'Demir Tesisat',
      about: '15 yıllık tesisat deneyimi. Tıkanıklık açma, kombi bakımı ve su kaçağı tespiti.',
      experienceYears: 15,
      categorySlug: 'su-tesisati',
      cityName: 'Gaziantep',
    },
  },
];
