'use client';

import { Input, Select } from '@talpio/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

/**
 * Arama kutusu. Her tuş vuruşunda istek atmamak için değer geciktirilir;
 * aksi halde "tesisat" yazmak altı ayrı sayfalama sorgusu üretirdi.
 *
 * Kutunun içeriği yalnızca bileşenin kendi durumundan gelir. Dışarıdan
 * sıfırlama gerektiğinde çağıran taraf `key` değiştirir; bu, dış değeri
 * içeri kopyalayan bir etki zincirinden daha öngörülebilir.
 */
export function SearchField({
  defaultValue = '',
  onChange,
  placeholder,
  label = 'Ara',
}: {
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
}) {
  const [draft, setDraft] = useState(defaultValue);
  const lastEmitted = useRef(defaultValue);

  // Üst bileşen her veri değişiminde yeniden çizilir; işleyiciyi ref'te tutmak
  // bekleme süresinin sürekli baştan başlamasını önler.
  const handlerRef = useRef(onChange);
  useEffect(() => {
    handlerRef.current = onChange;
  });

  useEffect(() => {
    if (draft === lastEmitted.current) return;

    const timer = setTimeout(() => {
      lastEmitted.current = draft;
      handlerRef.current(draft);
    }, 350);

    return () => clearTimeout(timer);
  }, [draft]);

  return (
    <Input
      type="search"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={placeholder}
      aria-label={label}
      className="sm:max-w-64"
    />
  );
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  allLabel,
}: {
  label: string;
  value: T | 'all';
  options: { value: T; label: string }[];
  onChange: (value: T | 'all') => void;
  allLabel: string;
}) {
  return (
    <Select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as T | 'all')}
      className="sm:max-w-52"
    >
      <option value="all">{allLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

export function FilterBar({
  children,
  onReset,
  canReset,
}: {
  children: ReactNode;
  onReset: () => void;
  canReset: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {canReset ? (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Temizle
        </Button>
      ) : null}
    </div>
  );
}
