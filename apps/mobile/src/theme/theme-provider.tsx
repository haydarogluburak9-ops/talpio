import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from './tokens';

interface ThemeValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeValue>({ colors: lightColors, isDark: false });

/**
 * Tema cihaz ayarını izler. Kullanıcı tercihi ayarlar ekranından geldiğinde
 * burada bir override katmanı eklenecek.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({ isDark, colors: isDark ? darkColors : lightColors }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}

export function useColors(): ThemeColors {
  return useContext(ThemeContext).colors;
}
