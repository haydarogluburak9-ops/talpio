import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export function LoadingState({ label }: { label?: string }) {
  const colors = useColors();

  return (
    <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.brand} />
      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();

  return (
    <View style={styles.centered}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons name={icon} size={26} color={colors.foregroundMuted} />
      </View>
      <Text variant="title" style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="muted" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="outline" size="sm" onPress={onAction} />
      ) : null}
    </View>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel: string;
}) {
  const colors = useColors();

  return (
    <View style={styles.centered}>
      <View style={[styles.iconWrap, { backgroundColor: colors.dangerSurface }]}>
        <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      </View>
      <Text variant="title" style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="muted" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {onRetry ? <Button label={retryLabel} variant="outline" size="sm" onPress={onRetry} /> : null}
    </View>
  );
}

/** Yükleme sırasında listenin yerini tutan gri bloklar. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  const colors = useColors();

  return (
    <View style={styles.skeletonList} accessibilityElementsHidden importantForAccessibility="no">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={index}
          style={[styles.skeletonRow, { backgroundColor: colors.surfaceMuted }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  center: { textAlign: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonList: { gap: spacing.md },
  skeletonRow: { height: 84, borderRadius: radius.card, opacity: 0.7 },
});
