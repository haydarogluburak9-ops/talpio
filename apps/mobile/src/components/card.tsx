import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { useColors } from '@/theme/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ onPress, padded = true, style, children, ...rest }: CardProps) {
  const colors = useColors();

  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          styles.touch,
          base,
          padded && styles.padded,
          pressed && styles.pressed,
          style as ViewStyle,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, base, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
  },
  touch: { minHeight: 44 },
  padded: { padding: spacing.lg, gap: spacing.sm, minHeight: 44 },
  pressed: { opacity: 0.9 },
});
