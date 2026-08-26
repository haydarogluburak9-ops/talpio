'use client';

import { resolveLocalizedText, resolveOptionLabel } from '@talpio/localization';
import type { AttributeFieldDefinition } from '@talpio/types';
import { Field, Input, Select } from '@talpio/ui';

import { getLocale, t } from '@/lib/i18n';

/**
 * Kategoriye özel alanların form durumu. Denetimli girdiler tek tip olsun diye
 * her değer metin olarak tutulur; gönderim anında şemadaki tipe çevrilir.
 */
export type AttributeValues = Record<string, string>;

/**
 * Şema metinleri veritabanından çok dilli gelir; ekranda gösterilecek dil
 * burada seçilir. Saklanan enum değerleri bundan etkilenmez.
 */
function labelFor(field: AttributeFieldDefinition, locale: string): string {
  const label = resolveLocalizedText(field.label, locale);
  const unit = resolveLocalizedText(field.unit, locale);
  return unit ? `${label} (${unit})` : label;
}

/** Doldurulmamış zorunlu alanların anahtarları. */
export function findMissingAttributes(
  fields: readonly AttributeFieldDefinition[],
  values: AttributeValues,
): string[] {
  return fields
    .filter((field) => field.required === true && (values[field.key] ?? '').trim() === '')
    .map((field) => field.key);
}

/** Alan değerlerini talebin `specifications` alanına yazılacak tiplere çevirir. */
export function toSpecificationValues(
  fields: readonly AttributeFieldDefinition[],
  values: AttributeValues,
): Record<string, string | number | boolean> {
  const specifications: Record<string, string | number | boolean> = {};

  for (const field of fields) {
    const raw = (values[field.key] ?? '').trim();
    if (raw === '') continue;

    if (field.type === 'boolean') {
      specifications[field.key] = raw === 'true';
      continue;
    }

    if (field.type === 'number' || field.type === 'decimal') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) specifications[field.key] = parsed;
      continue;
    }

    specifications[field.key] = raw;
  }

  return specifications;
}

interface ControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
}

function AttributeControl({
  field,
  value,
  locale,
  controlProps,
  onChange,
}: {
  field: AttributeFieldDefinition;
  value: string;
  locale: string;
  controlProps: ControlProps;
  onChange: (value: string) => void;
}) {
  if (field.type === 'enum') {
    return (
      <Select {...controlProps} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('commerce.selectPlaceholder')}</option>
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {resolveOptionLabel(option, locale)}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === 'boolean') {
    return (
      <Select {...controlProps} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{t('commerce.selectPlaceholder')}</option>
        <option value="true">{t('commerce.optionYes')}</option>
        <option value="false">{t('commerce.optionNo')}</option>
      </Select>
    );
  }

  if (field.type === 'number' || field.type === 'decimal') {
    return (
      <Input
        {...controlProps}
        type="number"
        inputMode={field.type === 'number' ? 'numeric' : 'decimal'}
        step={field.type === 'number' ? 1 : 'any'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <Input
      {...controlProps}
      type={field.type === 'date' ? 'date' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Seçili kategorinin alan şemasını forma ekler. Şema tanımlı olmayan
 * kategorilerde hiç görünmez.
 */
export function CategoryAttributeFields({
  fields,
  values,
  errors,
  onChange,
}: {
  fields: readonly AttributeFieldDefinition[];
  values: AttributeValues;
  errors: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const locale = getLocale();

  if (fields.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted/50 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {t('commerce.attributeSectionTitle')}
        </h2>
        <p className="mt-1 text-xs text-foreground-muted">{t('commerce.attributeSectionHint')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const hint = resolveLocalizedText(field.description, locale);

          return (
            <Field
              key={field.key}
              label={labelFor(field, locale)}
              required={field.required}
              {...(hint ? { hint } : {})}
              {...(errors[field.key] ? { error: errors[field.key] } : {})}
            >
              {(controlProps) => (
                <AttributeControl
                  field={field}
                  value={values[field.key] ?? ''}
                  locale={locale}
                  controlProps={controlProps}
                  onChange={(next) => onChange(field.key, next)}
                />
              )}
            </Field>
          );
        })}
      </div>
    </section>
  );
}
