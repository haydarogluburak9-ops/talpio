'use client';

import { Input } from '@talpio/ui';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { t } from '@/lib/i18n';

/**
 * Yazılabilir öneri kutusu: tıklanınca liste açılır, yazınca süzülür,
 * listede olmayan metin de serbestçe kabul edilir.
 *
 * Liste gövdeye portallanır; kariyer penceresi kaydırılabilir olduğu için
 * `absolute` menü orada kesilirdi.
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
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const query = value.trim();
  const exactMatch = options.some((option) => option.toLocaleLowerCase() === query.toLocaleLowerCase());
  const showCustom = query.length > 0 && !exactMatch;
  const showList = open && (options.length > 0 || showCustom);

  useLayoutEffect(() => {
    if (!open) return;
    const input = inputRef.current;
    if (!input) return;

    const sync = () => {
      const rect = input.getBoundingClientRect();
      setBox({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    };

    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [open, value, options.length]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 text-sm">
      <label htmlFor={inputId} className={labelClassName ?? 'font-medium text-foreground'}>
        {label}
      </label>
      <Input
        ref={inputRef}
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
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setOpen(false);
          }
        }}
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {showList && box && typeof document !== 'undefined'
        ? createPortal(
            <ul
              ref={listRef}
              role="listbox"
              style={{ top: box.top, left: box.left, width: box.width }}
              className="fixed z-[180] max-h-56 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
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
            </ul>,
            document.body,
          )
        : null}

      {hint ? <p className="text-xs font-normal text-foreground-muted">{hint}</p> : null}
    </div>
  );
}
