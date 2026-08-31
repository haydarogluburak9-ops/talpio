'use client';

import { Input } from '@talpio/ui';
import { useEffect, useId, useRef, useState } from 'react';

import { t } from '@/lib/i18n';

/**
 * Yazılabilir öneri kutusu: tıklayınca örnekler hemen altında listelenir,
 * yazınca süzülür, listede olmayan metin de kabul edilir.
 */
export function SuggestField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  required,
  autoFocus,
  options,
  labelClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  autoFocus?: boolean;
  options: string[];
  labelClassName?: string;
}) {
  const inputId = useId();
  const [open, setOpen] = useState(Boolean(autoFocus));
  const containerRef = useRef<HTMLDivElement>(null);
  const query = value.trim();
  const exactMatch = options.some((option) => option.toLocaleLowerCase() === query.toLocaleLowerCase());
  const showCustom = query.length > 0 && !exactMatch;
  const showList = open && (options.length > 0 || showCustom);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="flex flex-col gap-1 text-sm">
      <label htmlFor={inputId} className={labelClassName ?? 'font-medium text-foreground'}>
        {label}
      </label>
      <Input
        id={inputId}
        value={value}
        autoFocus={autoFocus}
        required={required}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setOpen(false);
          }
        }}
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {showList ? (
        <ul
          role="listbox"
          className="max-h-72 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {options.map((option) => (
            <li key={option} role="option">
              <button
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-sm transition hover:bg-surface-muted"
              >
                {option}
              </button>
            </li>
          ))}
          {showCustom ? (
            <li role="option">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full px-3 py-2 text-left text-sm font-medium text-accent-600 transition hover:bg-surface-muted"
              >
                {t('social.skillCustomOption', { name: query })}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      {hint ? <p className="text-xs font-normal text-foreground-muted">{hint}</p> : null}
    </div>
  );
}
