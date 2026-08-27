import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type ComposeAction = 'post' | 'request' | 'deal';

export function ComposeMenu({
  onPost,
  onDeal,
}: {
  onPost?: () => void;
  onDeal?: () => void;
}) {
  const { t } = useI18n();
  const colors = useColors();
  const router = useRouter();

  const items: {
    key: ComposeAction;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    tone: string;
    onPress: () => void;
  }[] = [
    {
      key: 'post',
      label: t('social.quickPost'),
      icon: 'create-outline',
      tone: colors.brand,
      onPress: () => onPost?.(),
    },
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
      onPress: () => onDeal?.(),
    },
  ];

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <Pressable key={item.key} onPress={item.onPress}>
          <Card style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: `${item.tone}22` }]}>
              <Ionicons name={item.icon} size={22} color={item.tone} />
            </View>
            <Text variant="bodyStrong">{item.label}</Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
