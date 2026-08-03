import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_spacing.dart';

/// Uygulamanın açık ve koyu temaları.
///
/// Tüm görsel kararlar burada toplanır; widget'lar sabit renk veya ölçü tanımlamaz.
abstract final class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isLight = brightness == Brightness.light;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: isLight ? AppPalette.brand600 : AppPalette.brand300,
      onPrimary: isLight ? Colors.white : AppPalette.brand950,
      primaryContainer: isLight ? AppPalette.brand50 : AppPalette.brand800,
      onPrimaryContainer: isLight ? AppPalette.brand700 : AppPalette.brand100,
      secondary: AppPalette.accent500,
      onSecondary: AppPalette.brand950,
      secondaryContainer: isLight ? AppPalette.accent100 : AppPalette.accent700,
      onSecondaryContainer: isLight ? AppPalette.accent700 : AppPalette.accent100,
      error: isLight ? AppPalette.danger700 : AppPalette.danger500,
      onError: Colors.white,
      errorContainer: isLight ? AppPalette.danger50 : const Color(0xFF3A1414),
      onErrorContainer: isLight ? AppPalette.danger700 : AppPalette.danger50,
      surface: isLight ? AppPalette.lightSurface : AppPalette.darkSurface,
      onSurface: isLight ? AppPalette.lightText : AppPalette.darkText,
      surfaceContainerLowest: isLight ? AppPalette.lightSurface : AppPalette.darkBackground,
      surfaceContainerLow: isLight ? AppPalette.lightBackground : AppPalette.darkSurface,
      surfaceContainer: isLight ? AppPalette.lightSurfaceMuted : AppPalette.darkSurfaceMuted,
      onSurfaceVariant: isLight ? AppPalette.lightTextMuted : AppPalette.darkTextMuted,
      outline: isLight ? AppPalette.lightBorder : AppPalette.darkBorder,
      outlineVariant: isLight ? AppPalette.lightBorder : AppPalette.darkBorder,
    );

    final semantic = isLight ? AppSemanticColors.light : AppSemanticColors.dark;
    final baseTextTheme = isLight
        ? Typography.material2021().black
        : Typography.material2021().white;

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: isLight ? AppPalette.lightBackground : AppPalette.darkBackground,
      extensions: [semantic],
      textTheme: _textTheme(baseTextTheme, colorScheme, semantic),
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surface,
        foregroundColor: colorScheme.onSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: baseTextTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w600,
          color: colorScheme.onSurface,
        ),
      ),
      cardTheme: CardThemeData(
        color: colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.cardRadius,
          side: BorderSide(color: semantic.border),
        ),
      ),
      dividerTheme: DividerThemeData(color: semantic.border, space: 1, thickness: 1),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.controlRadius),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          side: BorderSide(color: semantic.border),
          shape: const RoundedRectangleBorder(borderRadius: AppRadius.controlRadius),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: semantic.surfaceMuted,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        border: OutlineInputBorder(
          borderRadius: AppRadius.controlRadius,
          borderSide: BorderSide(color: semantic.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppRadius.controlRadius,
          borderSide: BorderSide(color: semantic.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppRadius.controlRadius,
          borderSide: BorderSide(color: colorScheme.primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppRadius.controlRadius,
          borderSide: BorderSide(color: colorScheme.error),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: semantic.surfaceMuted,
        side: BorderSide(color: semantic.border),
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.pillRadius),
        labelStyle: TextStyle(color: colorScheme.onSurface, fontWeight: FontWeight.w500),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.sheetRadius),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: colorScheme.primaryContainer,
        elevation: 0,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.controlRadius),
        backgroundColor: isLight ? AppPalette.brand900 : AppPalette.darkSurfaceMuted,
        contentTextStyle: const TextStyle(color: Colors.white),
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(color: colorScheme.primary),
    );
  }

  static TextTheme _textTheme(TextTheme base, ColorScheme colors, AppSemanticColors semantic) {
    return base.copyWith(
      displaySmall: base.displaySmall?.copyWith(
        fontWeight: FontWeight.w700,
        color: colors.onSurface,
      ),
      headlineMedium: base.headlineMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: colors.onSurface,
      ),
      headlineSmall: base.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
        color: colors.onSurface,
      ),
      titleLarge: base.titleLarge?.copyWith(fontWeight: FontWeight.w600, color: colors.onSurface),
      titleMedium: base.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: colors.onSurface),
      bodyLarge: base.bodyLarge?.copyWith(color: colors.onSurface, height: 1.45),
      bodyMedium: base.bodyMedium?.copyWith(color: colors.onSurface, height: 1.45),
      bodySmall: base.bodySmall?.copyWith(color: semantic.textMuted, height: 1.4),
      labelLarge: base.labelLarge?.copyWith(fontWeight: FontWeight.w600),
    );
  }
}
