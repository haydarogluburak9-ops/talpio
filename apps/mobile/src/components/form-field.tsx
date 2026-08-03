import { forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Text } from '@/components/text';
import { useColors } from '@/theme/theme-provider';
import { MIN_TOUCH_TARGET, radius, spacing, typography } from '@/theme/tokens';

export interface FormFieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  containerStyle?: ViewStyle;
}

export const FormField = forwardRef<TextInput, FormFieldProps>(function FormField(
  { label, error, hint, containerStyle, style, ...rest },
  ref,
) {
  const colors = useColors();

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>

      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.foregroundMuted}
        style={[
          styles.input,
          typography.body,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            color: colors.foreground,
          },
          style,
        ]}
        {...rest}
      />

      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
