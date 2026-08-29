'use client';

import { SKILL_LEVELS, type SkillLevel } from '@talpio/types';
import { Input } from '@talpio/ui';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';

import { apiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

/** Öneri sorgusu bu uzunluğun altında hiç atılmaz; backend de aynı sınırı uygular. */
const MIN_QUERY = 2;

export function skillLevelLabel(level: SkillLevel | null | undefined): string {
  if (!level) return t('social.skillLevelNone');
  return t(`social.skillLevel${level}` as 'social.skillLevelBEGINNER');
}

/**
 * Yetkinlik adı + derece girişi.
 *
 * Öneriler platformda kullanılan adlardan gelir. Sabit bir katalog altı dile
 * çevrilmek zorunda kalır ve kullanıcının kendi sektöründeki terim yine
 * listede bulunmazdı; bu yüzden yazılan her metin serbestçe kabul edilir ve
 * liste yalnızca yardımcıdır.
 */
export function SkillField({
  name,
  level,
  onNameChange,
  onLevelChange,
}: {
  name: string;
  level: SkillLevel | null;
  onNameChange: (value: string) => void;
  onLevelChange: (value: SkillLevel | null) => void;
}) {
  const nameId = useId();
  const levelId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const query = name.trim();
  const suggestions = useQuery({
    queryKey: ['social', 'skill-suggest', query],
    queryFn: ({ signal }) => apiClient.social.suggestSkills(query, signal),
    enabled: query.length >= MIN_QUERY,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Kullanıcının yazdığı ad zaten listedeyse ayrıca "şunu ekle" satırı gösterilmez.
  const options = suggestions.data ?? [];
  const exactMatch = options.some((option) => option.toLocaleLowerCase() === query.toLocaleLowerCase());
  const showCustom = query.length >= MIN_QUERY && !exactMatch;

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative flex flex-col gap-1 text-sm">
        <label htmlFor={nameId} className="text-foreground-muted">
          {t('social.skillName')}
        </label>
        <Input
          id={nameId}
          value={name}
          autoFocus
          placeholder={t('social.skillPlaceholder')}
          onChange={(event) => {
            onNameChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
          aria-autocomplete="list"
          aria-expanded={open}
        />

        {open && (options.length > 0 || showCustom) ? (
          <ul className="absolute top-full z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => {
                    onNameChange(option);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm transition hover:bg-surface-muted"
                >
                  {option}
                </button>
              </li>
            ))}
            {showCustom ? (
              <li>
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

        <p className="text-xs text-foreground-muted">{t('social.skillSuggestHint')}</p>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <label htmlFor={levelId} className="text-foreground-muted">
          {t('social.skillLevel')}
        </label>
        <select
          id={levelId}
          value={level ?? ''}
          onChange={(event) => onLevelChange((event.target.value || null) as SkillLevel | null)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent-500"
        >
          <option value="">{t('social.skillLevelNone')}</option>
          {SKILL_LEVELS.map((value) => (
            <option key={value} value={value}>
              {skillLevelLabel(value)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
