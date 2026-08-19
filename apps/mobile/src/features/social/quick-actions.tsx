import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type QuickAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
  onPress: () => void;
};

export function QuickActions({
  onMedia,
}: {
  onMedia?: () => void;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const items: QuickAction[] = [
    {
      key: 'request',
      label: t('social.quickRequest'),
      icon: 'clipboard-outline',
      tone: colors.warning,
      onPress: () => router.push('/customer/jobs/new'),
    },
    {
      key: 'deal',
      label: t('social.quickDeal'),
      icon: 'pricetag-outline',
      tone: colors.accent,
      onPress: () => router.push('/customer/requests/new'),
    },
    {
      key: 'media',
      label: t('social.quickMedia'),
      icon: 'image-outline',
      tone: colors.success,
      onPress: () => onMedia?.(),
    },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable key={item.key} onPress={item.onPress} style={styles.item}>
          <Card style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: `${item.tone}22` }]}>
              <Ionicons name={item.icon} size={18} color={item.tone} />
            </View>
            <Text variant="caption" style={styles.label}>
              {item.label}
            </Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  item: { flex: 1 },
  card: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { textAlign: 'center', fontWeight: '700' },
});
