'use client';

import { queryKeys } from '@talpio/config';
import { SKILL_LEVELS, type SkillLevel } from '@talpio/types';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';

import { apiClient } from '@/lib/api';
import { getLocale, t } from '@/lib/i18n';

import { careerExamples, mergeSuggestions } from './career-examples';
import { SuggestField } from './suggest-field';

export function skillLevelLabel(level: SkillLevel | null | undefined): string {
  if (!level) return t('social.skillLevelNone');
  return t(`social.skillLevel${level}` as 'social.skillLevelBEGINNER');
}

/**
 * Yetkinlik adı + derece girişi.
 *
 * Öneriler platformda kullanılan adlardan gelir; tıklayınca yaygın örnekler
 * de listelenir. Yazılan her metin serbestçe kabul edilir.
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
  const levelId = useId();
  const query = name.trim();
  const suggestions = useQuery({
    queryKey: queryKeys.social.skillSuggest(query),
    queryFn: ({ signal }) => apiClient.social.suggestSkills(query, signal),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-3">
      <SuggestField
        label={t('social.skillName')}
        value={name}
        onChange={onNameChange}
        autoFocus
        placeholder={t('social.skillPlaceholder')}
        hint={t('social.skillSuggestHint')}
        labelClassName="text-foreground-muted"
        options={mergeSuggestions(
          suggestions.data,
          careerExamples('skill', getLocale()),
          query,
          40,
          getLocale(),
        )}
      />

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
