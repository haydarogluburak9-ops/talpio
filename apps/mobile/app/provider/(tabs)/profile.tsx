import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { useLogout } from '@/features/auth/use-auth-mutations';
import { useCurrentUser } from '@/features/auth/use-current-user';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export default function ProviderProfileTabScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const user = useCurrentUser();
  const logout = useLogout();

  return (
    <Screen onRefresh={() => void user.refetch()} refreshing={user.isRefetching}>
      {user.isPending && <ListSkeleton rows={2} />}

      {user.data && (
        <Card>
          <Text variant="title" numberOfLines={1}>
            {user.data.fullName}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {user.data.email}
          </Text>
          <Badge tone="brand" label={user.data.role} />
        </Card>
      )}

      <Card onPress={() => router.push('/provider/profile/edit')}>
        <View style={styles.row}>
          <Ionicons name="person-circle-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('profile.title')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>

      {/* Ustanın alt sekmelerinde mesaj yok; yazışmalara profil üzerinden girilir. */}
      <Card onPress={() => router.push('/provider/messages')}>
        <View style={styles.row}>
          <Ionicons name="chatbubbles-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('messaging.listTitle')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>

      <Card onPress={() => router.push('/provider/notifications')}>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('notifications.title')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>

      <Card onPress={() => router.push('/provider/support')}>
        <View style={styles.row}>
          <Ionicons name="help-buoy-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('nav.support')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>

      <Card onPress={() => router.push('/provider/complaint')}>
        <View style={styles.row}>
          <Ionicons name="warning-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('complaint.createTitle')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>

      <Card onPress={() => router.push('/provider/settings')}>
        <View style={styles.row}>
          <Ionicons name="settings-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('settings.title')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>

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

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
});
