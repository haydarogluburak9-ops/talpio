'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useAdminCategories } from './use-catalog';

export function CategoriesTable() {
  const categories = useAdminCategories();

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Hizmet kategorileri</CardTitle>
          <CardDescription>
            Veritabanındaki güncel katalog. Düzenleme uçları devreye alındığında bu tablodan
            değiştirilebilecek.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void categories.refetch()}
          disabled={categories.isFetching}
        >
          {categories.isFetching ? 'Yenileniyor…' : 'Yenile'}
        </Button>
      </CardHeader>

      <CardContent>
        {categories.isPending ? (
          <p className="text-sm text-foreground-muted">Kategoriler yükleniyor…</p>
        ) : categories.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            Kategoriler alınamadı. API sunucusunun çalıştığını doğrulayın.
          </p>
        ) : categories.data.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Kayıtlı kategori yok. Tohum verisini çalıştırın: <code>npm run db:seed</code>
          </p>
        ) : (
          // Dar ekranda tablo yatay kaydırılır; hücreler sıkışıp okunmaz hâle gelmez.
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-foreground-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Kategori
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Kısa ad
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Alt kategori
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.data.map((category) => (
                  <tr key={category.id} className="border-b border-border last:border-0">
                    <td className="py-3 pr-4 font-medium">{category.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-foreground-muted">
                      {category.slug}
                    </td>
                    <td className="py-3 pr-4 text-foreground-muted">
                      {category.subcategories?.length ?? 0}
                    </td>
                    <td className="py-3">
                      <Badge tone={category.isActive ? 'success' : 'neutral'}>
                        {category.isActive ? 'Etkin' : 'Pasif'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
