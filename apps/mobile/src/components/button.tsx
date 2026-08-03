import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/text';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, radius, spacing } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  style?: ViewStyle;
}

const SIZE_STYLE: Record<Size, ViewStyle> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 36 },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: MIN_TOUCH_TARGET,
  },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 52 },
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  block = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled === true || loading;

  const surface: Record<Variant, ViewStyle> = {
    primary: { backgroundColor: colors.brand },
    secondary: { backgroundColor: colors.accent },
    outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.danger },
  };

  const labelTone = {
    primary: colors.onBrand,
    secondary: colors.onAccent,
    outline: colors.foreground,
    ghost: colors.brand,
    danger: '#ffffff',
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        SIZE_STYLE[size],
        surface[variant],
        block && styles.block,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading && <ActivityIndicator size="small" color={labelTone} />}
        <Text variant="bodyStrong" style={{ color: labelTone }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.control,
  },
  block: { alignSelf: 'stretch' },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
