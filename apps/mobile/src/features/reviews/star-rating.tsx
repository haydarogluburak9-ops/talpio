import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { REVIEW } from '@ustapilot/config';

import { Text } from '@/components/text';
import { useI18n } from '@/lib/i18n';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, spacing } from '@/theme/tokens';

const STARS = Array.from(
  { length: REVIEW.maxRating - REVIEW.minRating + 1 },
  (_, index) => REVIEW.minRating + index,
);

export interface StarRatingProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string | undefined;
}

/**
 * Puanlama alanı.
 *
 * Her yıldız ayrı bir dokunmatik hedeftir ve kaç puana karşılık geldiğini
 * erişilebilirlik etiketiyle söyler; yalnızca ikon gören biri seçimini
 * doğrulayamazdı.
 */
export function StarRating({ label, value, onChange, error }: StarRatingProps) {
  const { t } = useI18n();
  const colors = useColors();

  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <Text variant="caption" tone="muted" style={styles.flex}>
          {label}
        </Text>
        {value ? (
          <Text variant="caption" tone="muted">
            {t(`review.star${value}`)}
          </Text>
        ) : null}
      </View>

      <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {STARS.map((star) => {
          const selected = value !== undefined && star <= value;

          return (
            <Pressable
              key={star}
              accessibilityRole="radio"
              accessibilityState={{ selected: value === star }}
              accessibilityLabel={t('review.starLabel', { count: star })}
              onPress={() => onChange(star)}
              style={styles.star}
            >
              <Ionicons
                name={selected ? 'star' : 'star-outline'}
                size={26}
                color={selected ? colors.warning : colors.border}
              />
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Salt okunur yıldız gösterimi. Yarım puanlar en yakın tam yıldıza yuvarlanır. */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const { t } = useI18n();
  const colors = useColors();
  const filled = Math.round(value);

  return (
    <View style={styles.readonly} accessibilityLabel={t('review.starLabel', { count: value.toFixed(1) })}>
      {STARS.map((star) => (
        <Ionicons
          key={star}
          name={star <= filled ? 'star' : 'star-outline'}
          size={size}
          color={star <= filled ? colors.warning : colors.border}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  stars: { flexDirection: 'row', gap: spacing.xs },
  star: {
    minHeight: MIN_TOUCH_TARGET,
    minWidth: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readonly: { flexDirection: 'row', gap: 1 },
});
