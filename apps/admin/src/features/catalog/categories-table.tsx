'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@talpio/config';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api-client';

import { useAdminCategories } from './use-catalog';

export function CategoriesTable() {
  const queryClient = useQueryClient();
  const categories = useAdminCategories();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      apiClient.admin.createCategory({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
      }),
    onSuccess: () => {
      setName('');
      setSlug('');
      setFormError(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.categories({ withSubcategories: true }),
      });
      void categories.refetch();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.admin.updateCategory(id, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.catalog.categories({ withSubcategories: true }),
      });
      void categories.refetch();
    },
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Hizmet kategorileri</CardTitle>
          <CardDescription>
            Katalog oluşturma, etkinleştirme/pasifleştirme. Alt kategori yönetimi sonraki adım.
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

      <CardContent className="space-y-6">
        <form
          className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim() || !slug.trim()) {
              setFormError('Ad ve kısa ad zorunlu.');
              return;
            }
            create.mutate();
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kategori adı"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="kisa-ad"
            className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm"
          />
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? 'Ekleniyor…' : 'Ekle'}
          </Button>
          {formError ? (
            <p className="sm:col-span-3 text-sm text-danger-on-surface">{formError}</p>
          ) : null}
        </form>

        {categories.isPending ? (
          <p className="text-sm text-foreground-muted">Kategoriler yükleniyor…</p>
        ) : categories.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            Kategoriler alınamadı. Admin API uçlarının açık olduğundan emin olun.
          </p>
        ) : categories.data.length === 0 ? (
          <p className="text-sm text-foreground-muted">
            Kayıtlı kategori yok. Tohum verisini çalıştırın veya yukarıdan ekleyin.
          </p>
        ) : (
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[640px] border-collapse text-sm">
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
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Durum
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    İşlem
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
                    <td className="py-3 pr-4">
                      <Badge tone={category.isActive ? 'success' : 'neutral'}>
                        {category.isActive ? 'Etkin' : 'Pasif'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={() =>
                          toggle.mutate({ id: category.id, isActive: !category.isActive })
                        }
                      >
                        {category.isActive ? 'Pasifleştir' : 'Etkinleştir'}
                      </Button>
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
