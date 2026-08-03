import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { SUPPORTED_LOCALES, type SupportedLocale } from '@ustapilot/config';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

const LOCALE_LABELS: Record<SupportedLocale, string> = { tr: 'Türkçe', en: 'English' };

/**
 * Ayarlar içeriği müşteri ve usta bölümlerinde ortaktır; her iki yığın da bu
 * bileşeni kendi rotasından render eder.
 */
export function SettingsContent() {
  const { t, locale, setLocale } = useI18n();
  const { colors, isDark } = useTheme();

  return (
    <Screen>
      <Text variant="title">{t('settings.language')}</Text>

      {SUPPORTED_LOCALES.map((option) => {
        const selected = locale === option;
        return (
          <Card key={option} onPress={() => setLocale(option)}>
            <View style={styles.row}>
              <Ionicons
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selected ? colors.brand : colors.foregroundMuted}
              />
              <Text variant="bodyStrong" style={styles.rowLabel}>
                {LOCALE_LABELS[option]}
              </Text>
            </View>
          </Card>
        );
      })}

      <Text variant="title">{t('settings.theme')}</Text>
      <Card>
        <View style={styles.row}>
          <Ionicons
            name={isDark ? 'moon-outline' : 'sunny-outline'}
            size={20}
            color={colors.brand}
          />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {isDark ? t('settings.themeDark') : t('settings.themeLight')}
          </Text>
          <Text variant="caption" tone="muted">
            {t('settings.themeSystem')}
          </Text>
        </View>
      </Card>

      <Text variant="title">{t('settings.about')}</Text>
      <Card>
        <View style={styles.row}>
          <Text variant="body" style={styles.rowLabel}>
            {t('settings.version')}
          </Text>
          <Text variant="body" tone="muted">
            {Constants.expoConfig?.version ?? '0.1.0'}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
});
