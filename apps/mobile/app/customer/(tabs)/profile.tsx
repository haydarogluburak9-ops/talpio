import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useLogout } from '@/features/auth/use-auth-mutations';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function CustomerProfileScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const user = useCurrentUser();
  const logout = useLogout();

  const links = [
    {
      icon: 'person-circle-outline' as const,
      label: t('profile.title'),
      href: '/customer/profile/edit',
    },
    { icon: 'receipt-outline' as const, label: t('order.listTitle'), href: '/customer/orders' },
    { icon: 'star-outline' as const, label: t('review.writtenTitle'), href: '/customer/reviews' },
    { icon: 'card-outline' as const, label: t('payment.historyTitle'), href: '/customer/payments' },
    { icon: 'heart-outline' as const, label: t('nav.favorites'), href: '/customer/providers' },
    { icon: 'settings-outline' as const, label: t('settings.title'), href: '/customer/settings' },
  ];

  return (
    <Screen onRefresh={() => void user.refetch()} refreshing={user.isRefetching}>
      {user.isPending && <ListSkeleton rows={2} />}

      {user.data && (
        <Card>
          <View style={styles.identity}>
            <View style={[styles.avatar, { backgroundColor: colors.brand }]}>
              <Text variant="title" style={{ color: colors.onBrand }}>
                {initials(user.data.fullName)}
              </Text>
            </View>
            <View style={styles.identityCopy}>
              <Text variant="title" numberOfLines={1}>
                {user.data.fullName}
              </Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {user.data.email}
              </Text>
              <Badge tone="brand" label={user.data.role} />
            </View>
          </View>
        </Card>
      )}

      {links.map((link) => (
        <Card key={link.href} onPress={() => router.push(link.href)}>
          <View style={styles.row}>
            <Ionicons name={link.icon} size={22} color={colors.brand} />
            <Text variant="bodyStrong" style={styles.rowLabel}>
              {link.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
          </View>
        </Card>
      ))}

      <Button
        label={t('nav.logout')}
        variant="outline"
        block
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </Screen>
  );
}

/** Avatar görseli yoksa ad-soyad baş harfleri gösterilir. */
function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
});
