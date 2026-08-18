import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { CategoriesTable } from '@/features/catalog/categories-table';
import { t } from '@/lib/i18n';

export const metadata: Metadata = { title: t('admin.categories') };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Kategori ekleme', detail: 'Ad, kısa ad, ikon ve sıralama bilgisiyle yeni kategori.' },
  { label: 'Alt kategori', detail: 'Her kategoriye bağlı hizmet kalemlerinin yönetimi.' },
  { label: 'Etkinleştirme', detail: 'Kategoriyi silmeden istemcilerden gizleme.' },
  { label: 'Çeviri', detail: 'Kategori adlarının TR/EN karşılıkları.' },
];

export default function CategoriesPage() {
  return (
    <ModuleScaffold
      titleKey="admin.categories"
      descriptionKey="admin.categoriesHint"
      dataSource="POST/PATCH /admin/categories"
      capabilities={CAPABILITIES}
    >
      <CategoriesTable />
    </ModuleScaffold>
  );
}
