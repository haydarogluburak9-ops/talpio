import type { ReactNode } from 'react';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ModuleCapability {
  label: string;
  detail: string;
}

/**
 * Henüz API ucu olmayan yönetim modüllerinin iskeleti.
 *
 * Sahte tablo veya uydurma sayı göstermez; modülün ne yapacağını ve hangi
 * yeteneklerin planlandığını yazar. Uç bağlandığında bu bileşen yerini gerçek
 * listeye bırakır.
 */
export function ModuleScaffold({
  title,
  description,
  capabilities,
  dataSource,
  children,
}: {
  title: string;
  description: string;
  capabilities: ModuleCapability[];
  dataSource: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Topbar title={title} description={description} />

      <main className="flex-1 space-y-6 p-6">
        {children}

        <Card>
          <CardHeader>
            <CardTitle>Planlanan yetenekler</CardTitle>
            <CardDescription>
              Bu modül <code className="font-mono text-xs">{dataSource}</code> ucuna bağlandığında
              aşağıdaki işlemler kullanılabilir olacak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <li
                  key={capability.label}
                  className="rounded-[--radius-control] border border-dashed border-border p-4"
                >
                  <p className="text-sm font-medium">{capability.label}</p>
                  <p className="text-xs text-foreground-muted">{capability.detail}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
