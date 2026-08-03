import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/theme/theme-provider';
import { spacing } from '@/theme/tokens';

export interface ScreenProps {
  children: ReactNode;
  /** İçerik kaydırılabilir olsun mu? Liste ekranları kendi FlatList'ini kullanır. */
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
}

/**
 * Tüm ekranların ortak kabuğu: güvenli alan, klavye kaçınması ve
 * pull-to-refresh davranışını tek yerde toplar.
 */
export function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  padded = true,
  contentStyle,
}: ScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const content: ViewStyle = {
    // Alt sekme çubuğu ve ana ekran çizgisi içeriği kesmemeli.
    paddingBottom: insets.bottom + spacing.xl,
    ...(padded ? { paddingHorizontal: spacing.lg, paddingTop: spacing.lg } : null),
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.grow, content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, content, contentStyle]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1, gap: spacing.lg },
});
