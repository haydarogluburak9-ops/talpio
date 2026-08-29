'use client';

import { Input } from '@talpio/ui';
import { useEffect, useId, useRef, useState } from 'react';

import { localeTag, t } from '@/lib/i18n';

/** Kariyer kayıtlarında makul alt sınır; daha eskisi elle yazılabilir. */
const FIRST_YEAR = 1950;

/** O dildeki kısa ay adları. Ayrı bir çeviri tablosu tutmaya gerek yok. */
function monthNames(tag: string): string[] {
  const formatter = new Intl.DateTimeFormat(tag, { month: 'short' });
  return Array.from({ length: 12 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2000, index, 1))),
  );
}

/**
 * Ay + yıl alanı.
 *
 * Hem yazılabilir hem seçilebilir: klavyeyle hızlı giren kullanıcıyı takvime
 * mahkûm etmek de, ayın kaçıncı sırada olduğunu hatırlamak zorunda bırakmak da
 * gereksiz sürtünme yaratıyordu. Yazılan metin "AA/YYYY" veya yalnızca "YYYY"
 * olarak çözülür; ay isteğe bağlıdır çünkü çoğu kişi yılı hatırlar, ayı değil.
 */
export function MonthYearField({
  label,
  year,
  month,
  onChange,
  required,
  disabled,
}: {
  label: string;
  year: string;
  month: string;
  onChange: (year: string, month: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const tag = localeTag();
  const months = monthNames(tag);

  const display = month ? `${String(month).padStart(2, '0')}/${year}` : year;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Takvimde gezinilen yıl, seçili yıldan bağımsız: kullanıcı 2019'u seçtikten
  // sonra 2018'e bakmak isterse seçim kaybolmamalı.
  const [cursorYear, setCursorYear] = useState(() => Number(year) || new Date().getFullYear());

  const commitText = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      onChange('', '');
      return;
    }
    // "03/2020", "3-2020", "2020" ve "03.2020" hepsi kabul edilir; kullanıcıyı
    // tek bir ayraç biçimine zorlamanın karşılığı yok.
    const parts = trimmed.split(/[\/.\-\s]+/).filter(Boolean);
    const numbers = parts.map(Number).filter((value) => Number.isFinite(value));
    const yearPart = numbers.find((value) => value >= FIRST_YEAR);
    const monthPart = numbers.find((value) => value >= 1 && value <= 12 && value !== yearPart);

    if (yearPart == null) return;
    onChange(String(yearPart), monthPart != null ? String(monthPart) : '');
    setCursorYear(yearPart);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1 text-sm">
      <label htmlFor={inputId} className="text-foreground-muted">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </label>
      <Input
        id={inputId}
        value={open ? draft : display}
        disabled={disabled}
        placeholder="AA/YYYY"
        inputMode="numeric"
        onFocus={() => {
          setDraft(display);
          setOpen(true);
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commitText(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitText(draft);
            setOpen(false);
          }
          if (event.key === 'Escape') setOpen(false);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      />

      {open ? (
        <div className="absolute top-full z-50 mt-1 w-full rounded-xl border border-border bg-surface p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursorYear((prev) => prev - 1)}
              aria-label={String(cursorYear - 1)}
              className="rounded-lg px-2 py-1 text-foreground-muted transition hover:bg-surface-muted"
            >
              ‹
            </button>
            <span className="font-semibold tabular-nums">{cursorYear}</span>
            <button
              type="button"
              onClick={() => setCursorYear((prev) => prev + 1)}
              aria-label={String(cursorYear + 1)}
              className="rounded-lg px-2 py-1 text-foreground-muted transition hover:bg-surface-muted"
            >
              ›
            </button>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-1">
            {months.map((name, index) => {
              const value = index + 1;
              const isSelected = Number(year) === cursorYear && Number(month) === value;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(String(cursorYear), String(value));
                    setOpen(false);
                  }}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition hover:bg-surface-muted ${
                    isSelected ? 'bg-accent-500 text-white hover:bg-accent-500' : ''
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(String(cursorYear), '');
                setOpen(false);
              }}
              className="text-xs font-medium text-foreground-muted transition hover:text-foreground"
            >
              {t('social.dateMonthOnlyYear')}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('', '');
                setOpen(false);
              }}
              className="text-xs font-medium text-foreground-muted transition hover:text-foreground"
            >
              {t('social.dateClear')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
