import type { SupportedLocale } from '@talpio/config';

/** Dil bağımsız, yazınca da bulunan yaygın yetkinlikler. */
const SHARED_SKILLS = [
  'Microsoft Excel',
  'Microsoft Word',
  'Microsoft PowerPoint',
  'Microsoft Outlook',
  'Microsoft Teams',
  'Microsoft 365',
  'Microsoft Azure',
  'Windows',
  'CRM',
  'B2B',
  'SAP',
  'Salesforce',
  'AutoCAD',
  'SolidWorks',
  'SQL',
  'Python',
  'JavaScript',
  'HTML',
  'CSS',
  'Photoshop',
  'Illustrator',
  'Figma',
  'Power BI',
  'Tableau',
  'Google Ads',
  'SEO',
  'Excel',
  'Word',
  'PowerPoint',
  'Outlook',
  'Teams',
];

const LOCALE_SKILLS: Record<SupportedLocale, string[]> = {
  tr: [
    'Satış',
    'Pazarlama',
    'Müzakere',
    'Proje yönetimi',
    'Muhasebe',
    'Finans',
    'İnsan kaynakları',
    'Lojistik',
    'Satın alma',
    'Müşteri ilişkileri',
    'Dış ticaret',
    'E-ticaret',
    'Grafik tasarım',
    'İngilizce',
  ],
  en: [
    'Sales',
    'Marketing',
    'Negotiation',
    'Project management',
    'Accounting',
    'Finance',
    'Human resources',
    'Logistics',
    'Procurement',
    'Customer relations',
    'International trade',
    'E-commerce',
    'Graphic design',
    'English',
  ],
  de: [
    'Vertrieb',
    'Marketing',
    'Verhandlung',
    'Projektmanagement',
    'Buchhaltung',
    'Finanzen',
    'Personalwesen',
    'Logistik',
    'Einkauf',
    'Kundenbeziehungen',
    'Außenhandel',
    'E-Commerce',
    'Grafikdesign',
    'Englisch',
  ],
  es: [
    'Ventas',
    'Marketing',
    'Negociación',
    'Gestión de proyectos',
    'Contabilidad',
    'Finanzas',
    'Recursos humanos',
    'Logística',
    'Compras',
    'Relación con clientes',
    'Comercio exterior',
    'Comercio electrónico',
    'Diseño gráfico',
    'Inglés',
  ],
  fr: [
    'Vente',
    'Marketing',
    'Négociation',
    'Gestion de projet',
    'Comptabilité',
    'Finance',
    'Ressources humaines',
    'Logistique',
    'Achats',
    'Relation client',
    'Commerce international',
    'E-commerce',
    'Graphisme',
    'Anglais',
  ],
  ar: [
    'مبيعات',
    'تسويق',
    'تفاوض',
    'إدارة المشاريع',
    'محاسبة',
    'مالية',
    'موارد بشرية',
    'لوجستيات',
    'مشتريات',
    'علاقات العملاء',
    'تجارة خارجية',
    'تجارة إلكترونية',
    'تصميم جرافيك',
    'الإنجليزية',
  ],
};

const POSITION_EXAMPLES: Record<SupportedLocale, string[]> = {
  tr: [
    'Satış Müdürü',
    'Satış Temsilcisi',
    'Satış Danışmanı',
    'Yazılım Geliştirici',
    'Muhasebe Uzmanı',
    'Operasyon Müdürü',
    'Pazarlama Uzmanı',
    'İnsan Kaynakları Uzmanı',
    'Proje Yöneticisi',
    'Lojistik Uzmanı',
    'Satın Alma Uzmanı',
    'Finans Uzmanı',
    'Müşteri Temsilcisi',
    'Grafik Tasarımcı',
    'İş Analisti',
  ],
  en: [
    'Sales Manager',
    'Sales Representative',
    'Sales Consultant',
    'Software Developer',
    'Accountant',
    'Operations Manager',
    'Marketing Specialist',
    'HR Specialist',
    'Project Manager',
    'Logistics Specialist',
    'Procurement Specialist',
    'Finance Specialist',
    'Customer Support',
    'Graphic Designer',
    'Business Analyst',
  ],
  de: [
    'Vertriebsleiter',
    'Vertriebsmitarbeiter',
    'Vertriebsberater',
    'Softwareentwickler',
    'Buchhalter',
    'Betriebsleiter',
    'Marketing-Spezialist',
    'HR-Spezialist',
    'Projektleiter',
    'Logistik-Spezialist',
    'Einkäufer',
    'Finanzspezialist',
    'Kundenberater',
    'Grafikdesigner',
    'Business Analyst',
  ],
  es: [
    'Director de ventas',
    'Representante de ventas',
    'Consultor de ventas',
    'Desarrollador de software',
    'Contable',
    'Director de operaciones',
    'Especialista en marketing',
    'Especialista en RR. HH.',
    'Jefe de proyecto',
    'Especialista en logística',
    'Especialista en compras',
    'Especialista financiero',
    'Atención al cliente',
    'Diseñador gráfico',
    'Analista de negocio',
  ],
  fr: [
    'Directeur commercial',
    'Commercial',
    'Consultant commercial',
    'Développeur logiciel',
    'Comptable',
    'Directeur des opérations',
    'Spécialiste marketing',
    'Spécialiste RH',
    'Chef de projet',
    'Spécialiste logistique',
    'Acheteur',
    'Spécialiste finance',
    'Service client',
    'Graphiste',
    'Analyste métier',
  ],
  ar: [
    'مدير مبيعات',
    'مندوب مبيعات',
    'مستشار مبيعات',
    'مطور برمجيات',
    'محاسب',
    'مدير عمليات',
    'أخصائي تسويق',
    'أخصائي موارد بشرية',
    'مدير مشروع',
    'أخصائي لوجستيات',
    'أخصائي مشتريات',
    'أخصائي مالية',
    'خدمة العملاء',
    'مصمم جرافيك',
    'محلل أعمال',
  ],
};

const CITY_EXAMPLES: Record<SupportedLocale, string[]> = {
  tr: [
    'İstanbul',
    'Ankara',
    'İzmir',
    'Bursa',
    'Antalya',
    'Adana',
    'Konya',
    'Gaziantep',
    'Kocaeli',
    'Mersin',
    'Diyarbakır',
    'Kayseri',
    'Eskişehir',
    'Samsun',
    'Trabzon',
  ],
  en: [
    'Istanbul',
    'Ankara',
    'Izmir',
    'London',
    'Berlin',
    'Paris',
    'Madrid',
    'Dubai',
    'New York',
    'Amsterdam',
  ],
  de: ['Istanbul', 'Ankara', 'Izmir', 'Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln', 'Wien', 'Zürich'],
  es: ['Estambul', 'Ankara', 'Esmirna', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Ciudad de México', 'Buenos Aires'],
  fr: ['Istanbul', 'Ankara', 'Izmir', 'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bruxelles', 'Genève'],
  ar: ['إسطنبول', 'أنقرة', 'إزمير', 'دبي', 'الرياض', 'الدوحة', 'القاهرة', 'عمّان', 'بيروت'],
};

export function careerExamples(kind: 'skill' | 'position' | 'city', locale: SupportedLocale): string[] {
  if (kind === 'position') return POSITION_EXAMPLES[locale];
  if (kind === 'city') return CITY_EXAMPLES[locale];
  return uniqueNames([...SHARED_SKILLS, ...LOCALE_SKILLS[locale]], locale);
}

export function filterSuggestions(items: string[], query: string, locale = 'tr', limit = 16): string[] {
  const needle = query.trim().toLocaleLowerCase(locale);
  if (!needle) return items.slice(0, limit);

  const ranked = items
    .map((item) => {
      const hay = item.toLocaleLowerCase(locale);
      if (hay === needle) return { item, rank: 0 };
      if (hay.startsWith(needle)) return { item, rank: 1 };
      if (hay.includes(needle)) return { item, rank: 2 };
      return null;
    })
    .filter((row): row is { item: string; rank: number } => row !== null)
    .sort((a, b) => a.rank - b.rank || a.item.localeCompare(b.item, locale));

  return ranked.slice(0, limit).map((row) => row.item);
}

/** Katalog her zaman görünür; platformdaki adlar varsa öne eklenir. */
export function mergeSuggestions(
  remote: string[] | undefined,
  fallback: string[],
  query: string,
  limit = 16,
  locale = 'tr',
): string[] {
  return uniqueNames([...(remote ?? []), ...fallback], locale, query, limit);
}

function uniqueNames(items: string[], locale: string, query = '', limit = 48): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const item of items) {
    const key = item.trim().toLocaleLowerCase(locale);
    if (!item.trim() || seen.has(key)) continue;
    seen.add(key);
    unique.push(item.trim());
  }
  return filterSuggestions(unique, query, locale, limit);
}
