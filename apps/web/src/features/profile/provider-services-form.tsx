'use client';

import type { ProviderService } from '@talpio/types';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ListSkeleton,
} from '@talpio/ui';
import { useState } from 'react';

import { useCategories } from '@/features/catalog/use-categories';
import { t } from '@/lib/i18n';

import { FormStatus } from './account-profile-form';
import { useReplaceMyServices } from './use-profile';

/** Kullanıcı lirayı girer, sözleşme kuruş bekler. */
function liraToMinor(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function minorToLira(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value / 100);
}

/**
 * Hizmet düzenleyici.
 *
 * Seçim ve fiyat aynı formda tutulur; kaydetme tek istekte listenin tamamını
 * gönderir, böylece yarım kalan bir güncelleme ustayı yanlış kategorilerde
 * bırakmaz.
 */
export function ProviderServicesForm({ services }: { services: ProviderService[] }) {
  const categories = useCategories();
  const replace = useReplaceMyServices();

  const [selected, setSelected] = useState<Map<string, string>>(
    () => new Map(services.map((service) => [service.categoryId, minorToLira(service.startingPriceMinor)])),
  );

  function toggle(categoryId: string) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.set(categoryId, '');
      return next;
    });
  }

  function setPrice(categoryId: string, value: string) {
    setSelected((current) => new Map(current).set(categoryId, value));
  }

  function save() {
    replace.mutate(
      [...selected].map(([categoryId, price]) => ({
        categoryId,
        startingPriceMinor: liraToMinor(price),
      })),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.servicesSection')}</CardTitle>
        <p className="text-sm text-foreground-muted">{t('profile.servicesHint')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {categories.isPending ? <ListSkeleton rows={4} /> : null}

        {categories.data ? (
          <ul className="flex flex-col gap-2">
            {categories.data.map((category) => {
              const price = selected.get(category.id);
              const isSelected = price !== undefined;

              return (
                <li
                  key={category.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[--radius-control] border border-border p-3"
                >
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={isSelected}
                      onChange={() => toggle(category.id)}
                    />
                    {category.name}
                  </label>

                  {isSelected ? (
                    <label className="flex items-center gap-2 text-xs text-foreground-muted">
                      {t('profile.startingPrice')}
                      <Input
                        value={price}
                        onChange={(event) => setPrice(category.id, event.target.value)}
                        type="number"
                        min={0}
                        inputMode="decimal"
                        placeholder="1500"
                        className="h-9 w-28"
                      />
                      ₺
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {selected.size === 0 ? (
          <p className="text-sm text-foreground-muted">{t('profile.servicesEmpty')}</p>
        ) : null}

        <FormStatus error={replace.isError ? replace.error : null} isSuccess={replace.isSuccess} />

        <Button
          type="button"
          className="self-start"
          onClick={save}
          disabled={selected.size === 0}
          isLoading={replace.isPending}
        >
          {t('profile.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
