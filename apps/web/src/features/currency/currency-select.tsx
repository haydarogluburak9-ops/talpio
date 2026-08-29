'use client';

import {
  CURRENCY_CODES,
  POPULAR_CURRENCY_CODES,
  currencyDisplayName,
  currencySymbol,
} from '@talpio/config';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { localeTag, t } from '@/lib/i18n';

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

/**
 * Para birimi seçici.
 *
 * Liste 160 kaydı aşıyor; düz bir `<select>` içinde kullanıcı kendi para
 * birimini kaydırarak arıyor. Bu yüzden yazarak süzme var ve en çok kullanılan
 * dokuz para birimi ayrı bir grupta başa alınıyor.
 *
 * Adlar `Intl` üzerinden geldiği için arayüz dili değiştiğinde kendiliğinden
 * çevrilir; ayrı bir çeviri tablosu tutulmaz.
 */
export function CurrencySelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  const listId = `${inputId}-list`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const tag = localeTag();

  const options = useMemo<CurrencyOption[]>(
    () =>
      CURRENCY_CODES.map((code) => ({
        code,
        name: currencyDisplayName(code, tag),
        symbol: currencySymbol(code, tag),
      })),
    [tag],
  );

  const optionsByCode = useMemo(
    () => new Map(options.map((option) => [option.code, option])),
    [options],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(tag);
    if (!needle) {
      // Arama yokken önce popülerler, sonra tam liste. Kullanıcıların çoğu
      // buradan seçiyor ve alfabetik listede AED'nin başta olması tesadüf.
      const popular = POPULAR_CURRENCY_CODES.map((code) => optionsByCode.get(code)).filter(
        (option): option is CurrencyOption => option != null,
      );
      const rest = options.filter(
        (option) => !POPULAR_CURRENCY_CODES.includes(option.code as never),
      );
      return { popular, rest };
    }
    const rest = options.filter(
      (option) =>
        option.code.toLocaleLowerCase(tag).includes(needle) ||
        option.name.toLocaleLowerCase(tag).includes(needle),
    );
    return { popular: [], rest };
  }, [options, optionsByCode, query, tag]);

  // Dışarı tıklayınca kapan: açık kalan liste altındaki form alanlarını örtüyor.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const selected = optionsByCode.get(value.toUpperCase());

  const select = (code: string) => {
    onChange(code);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm text-foreground outline-none transition focus:border-accent-500 disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-semibold">{selected?.code ?? value}</span>
          {selected ? (
            <span className="truncate text-foreground-muted">
              {selected.symbol} · {selected.name}
            </span>
          ) : null}
        </span>
        <span aria-hidden className="text-foreground-muted">
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setOpen(false);
              // Tek sonuç kaldıysa Enter onu seçer; fareye uzanmadan bitirilsin.
              if (event.key === 'Enter') {
                event.preventDefault();
                const only = filtered.rest.length === 1 ? filtered.rest[0] : null;
                if (only) select(only.code);
              }
            }}
            placeholder={t('currency.searchPlaceholder')}
            aria-label={t('currency.searchPlaceholder')}
            className="w-full border-b border-border bg-surface px-3 py-2 text-sm outline-none"
          />
          <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto py-1">
            {filtered.popular.length > 0 ? (
              <>
                <li className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                  {t('currency.popular')}
                </li>
                {filtered.popular.map((option) => (
                  <CurrencyRow
                    key={`popular-${option.code}`}
                    option={option}
                    selected={option.code === value}
                    onSelect={select}
                  />
                ))}
                <li className="my-1 border-t border-border" />
              </>
            ) : null}

            {filtered.rest.length === 0 && filtered.popular.length === 0 ? (
              <li className="px-3 py-3 text-sm text-foreground-muted">{t('currency.noResults')}</li>
            ) : null}

            {filtered.rest.map((option) => (
              <CurrencyRow
                key={option.code}
                option={option}
                selected={option.code === value}
                onSelect={select}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CurrencyRow({
  option,
  selected,
  onSelect,
}: {
  option: CurrencyOption;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => onSelect(option.code)}
        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-surface-muted ${
          selected ? 'bg-surface-muted font-semibold' : ''
        }`}
      >
        <span className="w-10 shrink-0 font-semibold">{option.code}</span>
        <span className="w-8 shrink-0 text-foreground-muted">{option.symbol}</span>
        <span className="truncate text-foreground-muted">{option.name}</span>
      </button>
    </li>
  );
}
