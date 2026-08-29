import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { LOCALE_META, SUPPORTED_LOCALES } from '@talpio/config';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useLogout } from '@/features/auth/use-auth-mutations';
import { apiClient } from '@/lib/api';
import { CurrencyPicker } from '@/features/currency/currency-picker';
import { useMyCurrency } from '@/features/currency/use-currency';
import { useUpdateUserProfile } from '@/features/profile/use-profile';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

const WEB_ORIGIN = 'https://talpio.com';

/**
 * Ayarlar içeriği müşteri ve satıcı bölümlerinde ortaktır; her iki yığın da bu
 * bileşeni kendi rotasından render eder.
 */
export function SettingsContent() {
  const { t, locale, setLocale } = useI18n();
  const { colors, isDark } = useTheme();
  const logout = useLogout();
  const currency = useMyCurrency();
  const updateProfile = useUpdateUserProfile();

  // Seçim anında kaydedilir; ayrı bir "kaydet" düğmesi olmayan bu ekranda
  // kullanıcı değişikliğin uygulandığını başka türlü göremezdi.
  const saveCurrency = (code: string) => updateProfile.mutate({ currency: code });

  const confirmDelete = () => {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteAccountConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          void apiClient.users.deleteMe().finally(() => logout.mutate());
        },
      },
    ]);
  };

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
                {LOCALE_META[option].nativeLabel}
              </Text>
            </View>
          </Card>
        );
      })}

      <Text variant="title">{t('currency.label')}</Text>
      <Card>
        <CurrencyPicker value={currency} onChange={(code) => saveCurrency(code)} />
      </Card>

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

      <Text variant="title">{t('settings.privacy')}</Text>
      <Card onPress={() => void Linking.openURL(`${WEB_ORIGIN}/yasal/gizlilik`)}>
        <Text variant="bodyStrong">{t('settings.legalPrivacy')}</Text>
      </Card>
      <Card onPress={() => void Linking.openURL(`${WEB_ORIGIN}/yasal/kullanim-kosullari`)}>
        <Text variant="bodyStrong">{t('settings.legalTerms')}</Text>
      </Card>
      <Card onPress={() => void Linking.openURL(`${WEB_ORIGIN}/yasal/kvkk`)}>
        <Text variant="bodyStrong">{t('settings.legalKvkk')}</Text>
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

      <Card onPress={confirmDelete}>
        <Text variant="bodyStrong" tone="danger">
          {t('settings.deleteAccount')}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
});
