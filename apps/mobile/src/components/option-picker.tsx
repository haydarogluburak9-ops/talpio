import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { toLocaleTag } from '@talpio/localization';

import { FormField } from '@/components/form-field';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export interface PickerOption {
  id: string;
  name: string;
}

export interface OptionPickerProps {
  label: string;
  options: PickerOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Uzun listelerde (şehir gibi) arama alanı açar. */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyLabel: string;
  disabled?: boolean;
}

/**
 * Uzun seçenek listeleri için hafif seçici. Yerel bir modal yerine satır içi
 * liste kullanılır; sihirbaz adımları zaten kaydırılabilir olduğu için ek bir
 * katman gezinmeyi zorlaştırırdı.
 */
export function OptionPicker({
  label,
  options,
  selectedId,
  onSelect,
  searchable = false,
  searchPlaceholder,
  emptyLabel,
  disabled = false,
}: OptionPickerProps) {
  const colors = useColors();
  const { locale } = useI18n();
  const [query, setQuery] = useState('');

  // Küçültme dile bağlı: Türkçe'de "I" → "ı", İngilizce'de "i". Sabit 'tr'
  // bırakılırsa İngilizce arayüzde "Industrial" araması eşleşmez.
  const visible = useMemo(() => {
    if (!searchable || query.trim() === '') return options;
    const tag = toLocaleTag(locale);
    const needle = query.trim().toLocaleLowerCase(tag);
    return options.filter((option) => option.name.toLocaleLowerCase(tag).includes(needle));
  }, [locale, options, query, searchable]);

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>

      {searchable && !disabled && options.length > 8 ? (
        <FormField
          label={searchPlaceholder ?? label}
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          autoCorrect={false}
        />
      ) : null}

      {disabled || visible.length === 0 ? (
        <Text variant="caption" tone="muted">
          {emptyLabel}
        </Text>
      ) : (
        <View style={[styles.list, { borderColor: colors.border }]}>
          {visible.map((option, index) => {
            const selected = option.id === selectedId;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(option.id)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                  selected && { backgroundColor: colors.surfaceMuted },
                  pressed && styles.pressed,
                ]}
              >
                <Text variant="body" style={styles.rowLabel} numberOfLines={1}>
                  {option.name}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export interface MultiOptionPickerProps {
  label: string;
  options: PickerOption[];
  selectedIds: ReadonlySet<string>;
  onToggle: (option: PickerOption) => void;
  emptyLabel: string;
  /** Seçili satırın sağında gösterilecek ek denetim (fiyat girişi gibi). */
  renderExtra?: (option: PickerOption) => ReactNode;
}

/**
 * Çoklu seçim listesi. Tek seçimli sürümden ayrı tutulur çünkü seçili satır
 * yanında ek denetim gösterebilmesi gerekir ve seçim onay kutusuyla anlatılır.
 */
export function MultiOptionPicker({
  label,
  options,
  selectedIds,
  onToggle,
  emptyLabel,
  renderExtra,
}: MultiOptionPickerProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>

      {options.length === 0 ? (
        <Text variant="caption" tone="muted">
          {emptyLabel}
        </Text>
      ) : (
        <View style={[styles.list, { borderColor: colors.border }]}>
          {options.map((option, index) => {
            const selected = selectedIds.has(option.id);

            return (
              <View
                key={option.id}
                style={[index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={option.name}
                  onPress={() => onToggle(option)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? colors.brand : colors.foregroundMuted}
                  />
                  <Text variant="body" style={styles.rowLabel} numberOfLines={1}>
                    {option.name}
                  </Text>
                </Pressable>

                {selected && renderExtra ? (
                  <View style={styles.extra}>{renderExtra(option)}</View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  list: { borderWidth: 1, borderRadius: radius.control, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  rowLabel: { flex: 1 },
  pressed: { opacity: 0.7 },
  extra: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
});
