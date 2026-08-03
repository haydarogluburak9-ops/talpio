import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { UserRole } from '@ustapilot/types';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

/**
 * Kayıt öncesi rol seçimi. Seçim kayıt formuna sorgu parametresiyle taşınır;
 * kalıcı karar hesap oluşturulurken backend'de verilir.
 */
export default function RoleSelectScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();

  const options = [
    {
      role: UserRole.CUSTOMER,
      icon: 'home-outline' as const,
      title: t('auth.roleCustomer'),
      body: t('roleSelect.customerBody'),
    },
    {
      role: UserRole.PROVIDER,
      icon: 'construct-outline' as const,
      title: t('auth.roleProvider'),
      body: t('roleSelect.providerBody'),
    },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="displaySm">{t('roleSelect.title')}</Text>
        <Text variant="body" tone="muted">
          {t('roleSelect.subtitle')}
        </Text>
      </View>

      {options.map((option) => (
        <Card key={option.role} onPress={() => router.push('/(auth)/register')}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name={option.icon} size={24} color={colors.brand} />
            </View>
            <View style={styles.copy}>
              <Text variant="title">{option.title}</Text>
              <Text variant="caption" tone="muted">
                {option.body}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.foregroundMuted} />
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: spacing.xs },
});
