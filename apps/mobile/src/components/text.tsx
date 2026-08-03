import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useColors } from '@/theme/theme-provider';
import { typography } from '@/theme/tokens';

type Variant = keyof typeof typography;
type Tone = 'default' | 'muted' | 'brand' | 'danger' | 'success' | 'onBrand';

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
}

export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const colors = useColors();

  const toneColor: Record<Tone, string> = {
    default: colors.foreground,
    muted: colors.foregroundMuted,
    brand: colors.brand,
    danger: colors.danger,
    success: colors.success,
    onBrand: colors.onBrand,
  };

  return (
    <RNText
      style={[typography[variant] as TextStyle, { color: toneColor[tone] }, style]}
      {...rest}
    />
  );
}
