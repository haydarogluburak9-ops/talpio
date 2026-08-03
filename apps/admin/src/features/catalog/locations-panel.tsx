'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useCities, useCountries } from './use-catalog';

export function LocationsPanel() {
  const countries = useCountries();
  const [selectedCode, setSelectedCode] = useState<string | undefined>(undefined);

  // Kullanıcı seçim yapmadıysa ilk ülke gösterilir; sabit bir ülke koda gömülmez.
  const activeCode = selectedCode ?? countries.data?.[0]?.code;
  const cities = useCities(activeCode);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konum hiyerarşisi</CardTitle>
        <CardDescription>
          Ülke, şehir ve ilçeler veritabanından gelir; hiçbir konum istemciye gömülmez.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {countries.isPending ? (
          <p className="text-sm text-foreground-muted">Ülkeler yükleniyor…</p>
        ) : countries.isError ? (
          <p role="alert" className="text-sm text-danger-on-surface">
            Konum verisi alınamadı. API sunucusunun çalıştığını doğrulayın.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {countries.data.map((country) => {
                const isActive = country.code === activeCode;
                return (
                  <button
                    key={country.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelectedCode(country.code)}
                    className={`rounded-[--radius-control] border px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10'
                        : 'border-border text-foreground-muted hover:bg-surface-muted'
                    }`}
                  >
                    {country.name}
                  </button>
                );
              })}
            </div>

            {cities.isPending ? (
              <p className="text-sm text-foreground-muted">Şehirler yükleniyor…</p>
            ) : cities.isError ? (
              <p role="alert" className="text-sm text-danger-on-surface">
                Şehirler alınamadı.
              </p>
            ) : cities.data.length === 0 ? (
              <p className="text-sm text-foreground-muted">
                Bu ülke için kayıtlı şehir yok. Tohum verisini çalıştırın: <code>npm run db:seed</code>
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cities.data.map((city) => (
                  <li
                    key={city.id}
                    className="flex items-center justify-between gap-2 rounded-[--radius-control] border border-border p-3 text-sm"
                  >
                    <span className="truncate">{city.name}</span>
                    <Badge tone={city.isActive ? 'success' : 'neutral'}>
                      {city.isActive ? 'Etkin' : 'Pasif'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
