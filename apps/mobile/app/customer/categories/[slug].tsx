import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { ApiError } from '@talpio/api-client';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ErrorState, ListSkeleton } from '@/components/state-views';
import { Text } from '@/components/text';
import { CategoryIcon } from '@/features/catalog/category-icon';
import { useCategory } from '@/features/catalog/use-categories';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export default function CategoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, categoryName } = useI18n();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useColors();
  const category = useCategory(slug ?? '');

  // Başlık veri geldikten sonra güncellenir; yükleme sırasında jenerik kalır.
  useEffect(() => {
    if (category.data) navigation.setOptions({ title: categoryName(category.data) });
  }, [category.data, categoryName, navigation]);

  const isNotFound = category.error instanceof ApiError && category.error.status === 404;

  return (
    <Screen onRefresh={() => void category.refetch()} refreshing={category.isRefetching}>
      {category.isPending && <ListSkeleton rows={3} />}

      {category.isError && (
        <ErrorState
          title={isNotFound ? t('status.notFoundTitle') : t('status.networkErrorTitle')}
          description={isNotFound ? undefined : t('status.networkErrorMessage')}
          retryLabel={t('common.retry')}
          {...(isNotFound ? {} : { onRetry: () => void category.refetch() })}
        />
      )}

      {category.data && (
        <>
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}>
              <CategoryIcon iconKey={category.data.iconKey} size={28} color={colors.brand} />
            </View>
            <Text variant="displaySm">{categoryName(category.data)}</Text>
            {category.data.description ? (
              <Text variant="body" tone="muted">
                {category.data.description}
              </Text>
            ) : null}
          </View>

          {(category.data.subcategories ?? []).map((subcategory) => (
            <Card key={subcategory.id}>
              <View style={styles.row}>
                <Ionicons name="ellipse" size={8} color={colors.accent} />
                <Text variant="bodyStrong" style={styles.rowLabel}>
                  {categoryName(subcategory)}
                </Text>
              </View>
            </Card>
          ))}

          <Button
            label={t('nav.newRequest')}
            block
            onPress={() =>
              router.push({
                pathname: '/customer/jobs/new',
                params: { categoryId: category.data.id },
              })
            }
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowLabel: { flex: 1 },
});
