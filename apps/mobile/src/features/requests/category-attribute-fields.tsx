import type { AttributeFieldDefinition } from '@talpio/types';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { OptionPicker } from '@/components/option-picker';
import { Text } from '@/components/text';
import { useT } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/**
 * Kategoriye özel alanların form durumu. Web ile aynı biçimde her değer metin
 * olarak tutulur; gönderim anında şemadaki tipe çevrilir.
 */
export type AttributeValues = Record<string, string>;

/** Seçimi boşaltan satırın kimliği; şema seçenekleriyle çakışmasın diye ayrık. */
const UNSET_OPTION_ID = '__unset__';

function labelFor(field: AttributeFieldDefinition): string {
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;
  return field.required === true ? `${label} *` : label;
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

function AttributeControl({
  field,
  value,
  error,
  onChange,
}: {
  field: AttributeFieldDefinition;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  const t = useT();
  const label = labelFor(field);

  if (field.type === 'enum' || field.type === 'boolean') {
    const options =
      field.type === 'boolean'
        ? [
            { id: 'true', name: t('commerce.optionYes') },
            { id: 'false', name: t('commerce.optionNo') },
          ]
        : (field.options ?? []).map((option) => ({ id: option, name: option }));

    return (
      <View style={styles.picker}>
        <OptionPicker
          label={label}
          options={[{ id: UNSET_OPTION_ID, name: t('commerce.selectPlaceholder') }, ...options]}
          selectedId={value === '' ? UNSET_OPTION_ID : value}
          onSelect={(id) => onChange(id === UNSET_OPTION_ID ? '' : id)}
          emptyLabel={t('commerce.selectPlaceholder')}
        />
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : field.description ? (
          <Text variant="caption" tone="muted">
            {field.description}
          </Text>
        ) : null}
      </View>
    );
  }

  if (field.type === 'number' || field.type === 'decimal') {
    return (
      <FormField
        label={label}
        value={value}
        onChangeText={onChange}
        keyboardType={field.type === 'number' ? 'number-pad' : 'decimal-pad'}
        error={error}
        hint={field.description}
      />
    );
  }

  return (
    <FormField
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder={field.type === 'date' ? t('commerce.attributeDatePlaceholder') : undefined}
      error={error}
      hint={field.description}
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
  const t = useT();

  if (fields.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="bodyStrong">{t('commerce.attributeSectionTitle')}</Text>
        <Text variant="caption" tone="muted">
          {t('commerce.attributeSectionHint')}
        </Text>
      </View>

      {fields.map((field) => (
        <AttributeControl
          key={field.key}
          field={field}
          value={values[field.key] ?? ''}
          error={errors[field.key]}
          onChange={(next) => onChange(field.key, next)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  header: { gap: spacing.xs },
  picker: { gap: spacing.xs },
});
