import type { Metadata } from 'next';

import { ModuleScaffold, type ModuleCapability } from '@/components/layout/module-scaffold';
import { CategoriesTable } from '@/features/catalog/categories-table';

export const metadata: Metadata = { title: 'Kategoriler' };

const CAPABILITIES: ModuleCapability[] = [
  { label: 'Kategori ekleme', detail: 'Ad, kısa ad, ikon ve sıralama bilgisiyle yeni kategori.' },
  { label: 'Alt kategori', detail: 'Her kategoriye bağlı hizmet kalemlerinin yönetimi.' },
  { label: 'Etkinleştirme', detail: 'Kategoriyi silmeden istemcilerden gizleme.' },
  { label: 'Çeviri', detail: 'Kategori adlarının TR/EN karşılıkları.' },
];

export default function CategoriesPage() {
  return (
    <ModuleScaffold
      title="Kategoriler"
      description="Hizmet kataloğunu görüntüleyin ve yönetin."
      dataSource="POST/PATCH /admin/categories"
      capabilities={CAPABILITIES}
    >
      <CategoriesTable />
    </ModuleScaffold>
  );
}
