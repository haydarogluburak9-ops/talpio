import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { CategoryIcon } from '@/features/catalog/category-icon';
import { useCategories } from '@/features/catalog/use-categories';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function CustomerHomeScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const colors = useColors();
  const categories = useCategories();

  return (
    <Screen onRefresh={() => void categories.refetch()} refreshing={categories.isRefetching}>
      <Card style={{ backgroundColor: colors.brand, borderColor: colors.brand }}>
        <Text variant="title" style={{ color: colors.onBrand }}>
          {t('home.heroTitle')}
        </Text>
        <Text variant="caption" style={{ color: colors.onBrand, opacity: 0.85 }}>
          {t('home.heroSubtitle')}
        </Text>
        <Button
          label={t('nav.newRequest')}
          variant="secondary"
          block
          style={{ marginTop: spacing.sm }}
          onPress={() => router.push('/customer/jobs/new')}
        />
      </Card>

      <Text variant="title">{t('home.popularCategories')}</Text>

      {categories.isPending && <ListSkeleton rows={3} />}

      {categories.isError && (
        <ErrorState
          title={t('status.networkErrorTitle')}
          description={t('status.networkErrorMessage')}
          retryLabel={t('common.retry')}
          onRetry={() => void categories.refetch()}
        />
      )}

      {categories.data?.length === 0 && <EmptyState title={t('status.emptyCategories')} />}

      {categories.data && categories.data.length > 0 && (
        <View style={styles.grid}>
          {categories.data.map((category) => (
            <Card
              key={category.id}
              style={styles.gridItem}
              onPress={() => router.push(`/customer/categories/${category.slug}`)}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}>
                <CategoryIcon iconKey={category.iconKey} color={colors.brand} />
              </View>
              <Text variant="bodyStrong" numberOfLines={2}>
                {category.name}
              </Text>
            </Card>
          ))}
        </View>
      )}

      <Card onPress={() => router.push('/customer/providers')}>
        <View style={styles.row}>
          <Ionicons name="people-outline" size={22} color={colors.brand} />
          <Text variant="bodyStrong" style={styles.rowLabel}>
            {t('home.nearbyProviders')}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.foregroundMuted} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  // İki sütun: yüzde payı boşlukla birlikte 100'ü aşmaz, dar ekranda taşma olmaz.
  gridItem: { width: '47.5%', minHeight: 120 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
});
