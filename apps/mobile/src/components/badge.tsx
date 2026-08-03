import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const colors = useColors();

  const styleByTone: Record<BadgeTone, { backgroundColor: string; color: string }> = {
    neutral: { backgroundColor: colors.surfaceMuted, color: colors.foregroundMuted },
    brand: { backgroundColor: colors.surfaceMuted, color: colors.brandStrong },
    accent: { backgroundColor: colors.accentSurface, color: colors.accentOnSurface },
    success: { backgroundColor: colors.successSurface, color: colors.successOnSurface },
    warning: { backgroundColor: colors.warningSurface, color: colors.warningOnSurface },
    danger: { backgroundColor: colors.dangerSurface, color: colors.dangerOnSurface },
    info: { backgroundColor: colors.infoSurface, color: colors.infoOnSurface },
  };

  const resolved = styleByTone[tone];

  return (
    <View style={[styles.badge, { backgroundColor: resolved.backgroundColor }]}>
      <Text variant="caption" style={{ color: resolved.color, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
