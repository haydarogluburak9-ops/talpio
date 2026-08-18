'use client';

import type { ReactNode } from 'react';

import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/lib/i18n';

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
  titleKey,
  description,
  descriptionKey,
  capabilities,
  dataSource,
  children,
}: {
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  capabilities: ModuleCapability[];
  dataSource: string;
  children?: ReactNode;
}) {
  return (
    <>
      <Topbar
        title={title}
        titleKey={titleKey}
        description={description}
        descriptionKey={descriptionKey}
      />

      <main className="flex-1 space-y-6 p-6">
        {children}

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.plannedCapabilities')}</CardTitle>
            <CardDescription>
              {t('admin.plannedCapabilitiesHint', { source: dataSource })}
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
