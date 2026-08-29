import {
  CURRENCY_CODES,
  POPULAR_CURRENCY_CODES,
  currencyDisplayName,
  currencySymbol,
} from '@talpio/config';
import { toLocaleTag } from '@talpio/localization';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { OptionPicker, type PickerOption } from '@/components/option-picker';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { spacing } from '@/theme/tokens';

/** Arama boşken gösterilecek en fazla satır. */
const BROWSE_LIMIT = 12;

/**
 * Para birimi seçici.
 *
 * Katalog 160 kaydı aşıyor; hepsini satır içi listeye basmak ekranı kilitler.
 * Bu yüzden arama boşken yalnızca sık kullanılanlar, arama yazıldığında ise
 * eşleşen kayıtlar gösterilir ve sonuç sayısı sınırlanır.
 */
export function CurrencyPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const tag = toLocaleTag(locale);

  const all = useMemo<PickerOption[]>(
    () =>
      CURRENCY_CODES.map((code) => ({
        id: code,
        name: `${code} · ${currencySymbol(code, tag)} · ${currencyDisplayName(code, tag)}`,
      })),
    [tag],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(tag);
    if (!needle) {
      const popular = new Set<string>([...POPULAR_CURRENCY_CODES, value.toUpperCase()]);
      return all.filter((option) => popular.has(option.id));
    }
    return all
      .filter((option) => option.name.toLocaleLowerCase(tag).includes(needle))
      .slice(0, BROWSE_LIMIT);
  }, [all, query, tag, value]);

  return (
    <View style={styles.container}>
      <FormField
        label={label ?? t('currency.label')}
        value={query}
        onChangeText={setQuery}
        placeholder={t('currency.searchPlaceholder')}
        autoCorrect={false}
        autoCapitalize="characters"
      />
      <OptionPicker
        label={query.trim() ? t('currency.label') : t('currency.popular')}
        options={visible}
        selectedId={value.toUpperCase()}
        onSelect={(code) => {
          onChange(code);
          setQuery('');
        }}
        emptyLabel={t('currency.noResults')}
      />
      <Text variant="caption" tone="muted">
        {t('currency.help')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});
