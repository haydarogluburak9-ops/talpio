'use client';

import { Input } from '@talpio/ui';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { getLocale } from '@/lib/i18n';

export interface SearchSelectOption {
  id: string;
  label: string;
}

/**
 * Tıklayınca liste açılan, yazınca süzülen seçim kutusu.
 * Seçilen değer kimlik olarak tutulur (kategori, şehir, ilçe).
 */
export function SearchSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  allowCustom = false,
  emptyLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  emptyLabel?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const locale = getLocale();
  const selected = options.find((option) => option.id === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected?.label ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery(selected?.label ?? (allowCustom ? value : ''));
  }, [allowCustom, open, selected?.label, value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale);
    if (!needle) return options.slice(0, 40);
    return options
      .filter((option) => option.label.toLocaleLowerCase(locale).includes(needle))
      .slice(0, 40);
  }, [locale, options, query]);

  const exact = options.some((option) => option.label.toLocaleLowerCase(locale) === query.trim().toLocaleLowerCase(locale));
  const showCustom = allowCustom && query.trim().length > 0 && !exact;

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={inputId}
        value={open ? query : (selected?.label ?? (allowCustom ? value : ''))}
        placeholder={placeholder}
        required={required && !value}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setQuery('');
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (allowCustom) onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
      />
      {open && !disabled && (filtered.length > 0 || showCustom || emptyLabel) ? (
        <ul className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {filtered.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setQuery(option.label);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm transition hover:bg-surface-muted"
              >
                {option.label}
              </button>
            </li>
          ))}
          {showCustom ? (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(query.trim());
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm font-medium text-accent-600 transition hover:bg-surface-muted"
              >
                {query.trim()}
              </button>
            </li>
          ) : null}
          {filtered.length === 0 && !showCustom && emptyLabel ? (
            <li className="px-3 py-2 text-sm text-foreground-muted">{emptyLabel}</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
