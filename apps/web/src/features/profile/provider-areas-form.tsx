'use client';

import type { EntityRef } from '@talpio/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ListSkeleton,
  Select,
} from '@talpio/ui';
import { useState } from 'react';

import { useCities, useDistricts } from '@/features/catalog/use-locations';
import { t } from '@/lib/i18n';

import { FormStatus } from './account-profile-form';
import { useReplaceMyServiceAreas } from './use-profile';

/**
 * Hizmet bölgesi düzenleyici.
 *
 * Seçim birden çok şehre yayılabildiği için seçili ilçeler adlarıyla birlikte
 * ayrıca tutulur; yalnızca kimlik saklansaydı başka bir şehre geçildiğinde
 * önceki seçimler adsız kalırdı.
 */
export function ProviderAreasForm({ areas }: { areas: EntityRef[] }) {
  const cities = useCities();
  const replace = useReplaceMyServiceAreas();

  const [cityId, setCityId] = useState('');
  const [selected, setSelected] = useState<Map<string, string>>(
    () => new Map(areas.map((area) => [area.id, area.name])),
  );

  const districts = useDistricts(cityId || undefined);

  function toggle(district: EntityRef) {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(district.id)) next.delete(district.id);
      else next.set(district.id, district.name);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('profile.areasSection')}</CardTitle>
        <p className="text-sm text-foreground-muted">{t('profile.areasHint')}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {selected.size > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {[...selected].map(([id, name]) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggle({ id, name })}
                  aria-label={`${name} — ${t('upload.remove')}`}
                >
                  <Badge tone="brand">{name} ×</Badge>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-foreground-muted">{t('profile.areasEmpty')}</p>
        )}

        <Select
          value={cityId}
          onChange={(event) => setCityId(event.target.value)}
          disabled={cities.isPending}
          aria-label={t('profile.selectCity')}
        >
          <option value="">{t('profile.selectCity')}</option>
          {cities.data?.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </Select>

        {districts.isPending && cityId ? <ListSkeleton rows={3} /> : null}

        {districts.data ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {districts.data.map((district) => (
              <li key={district.id}>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={selected.has(district.id)}
                    onChange={() => toggle({ id: district.id, name: district.name })}
                  />
                  {district.name}
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        <FormStatus error={replace.isError ? replace.error : null} isSuccess={replace.isSuccess} />

        <Button
          type="button"
          className="self-start"
          onClick={() => replace.mutate([...selected.keys()])}
          disabled={selected.size === 0}
          isLoading={replace.isPending}
        >
          {t('profile.save')}
        </Button>
      </CardContent>
    </Card>
  );
}
