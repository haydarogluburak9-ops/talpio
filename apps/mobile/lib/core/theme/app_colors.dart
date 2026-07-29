import 'package:flutter/material.dart';

/// Ham renk paleti.
///
/// Ekranlar bu sınıfı doğrudan kullanmaz; renklere `Theme.of(context).colorScheme`
/// veya [AppSemanticColors] üzerinden erişilir. Palet, admin panelindeki
/// `globals.css` belirteçleriyle birebir aynıdır.
abstract final class AppPalette {
  // Marka - lacivert: güven ve profesyonellik
  static const brand50 = Color(0xFFEEF4FB);
  static const brand100 = Color(0xFFD6E4F5);
  static const brand200 = Color(0xFFADC8EA);
  static const brand300 = Color(0xFF7BA5DB);
  static const brand400 = Color(0xFF4A7FC6);
  static const brand500 = Color(0xFF2B5FA8);
  static const brand600 = Color(0xFF1D4685);
  static const brand700 = Color(0xFF163667);
  static const brand800 = Color(0xFF10284C);
  static const brand900 = Color(0xFF0B1C36);
  static const brand950 = Color(0xFF061125);

  // Vurgu - amber: aksiyon ve usta vurgusu
  static const accent100 = Color(0xFFFFEDC7);
  static const accent300 = Color(0xFFFFC14D);
  static const accent500 = Color(0xFFF59E0B);
  static const accent600 = Color(0xFFD97706);
  static const accent700 = Color(0xFFB45309);

  // Durum renkleri
  static const success50 = Color(0xFFECFDF3);
  static const success500 = Color(0xFF16A34A);
  static const success700 = Color(0xFF15803D);
  static const warning50 = Color(0xFFFFFBEB);
  static const warning500 = Color(0xFFF59E0B);
  static const warning700 = Color(0xFFB45309);
  static const danger50 = Color(0xFFFEF2F2);
  static const danger500 = Color(0xFFDC2626);
  static const danger700 = Color(0xFFB91C1C);
  static const info50 = Color(0xFFEFF6FF);
  static const info500 = Color(0xFF2563EB);
  static const info700 = Color(0xFF1D4ED8);

  // Nötr - açık tema
  static const lightBackground = Color(0xFFF6F7F9);
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightSurfaceMuted = Color(0xFFF1F3F6);
  static const lightBorder = Color(0xFFE2E6EC);
  static const lightText = Color(0xFF0B1C36);
  static const lightTextMuted = Color(0xFF5B6B81);

  // Nötr - koyu tema
  static const darkBackground = Color(0xFF060D18);
  static const darkSurface = Color(0xFF0D1726);
  static const darkSurfaceMuted = Color(0xFF131F31);
  static const darkBorder = Color(0xFF1E2C40);
  static const darkText = Color(0xFFE8EDF4);
  static const darkTextMuted = Color(0xFF94A3B8);
}

/// Material [ColorScheme] içinde karşılığı olmayan anlamsal renkler.
///
/// Kullanım: `Theme.of(context).extension<AppSemanticColors>()!`
@immutable
class AppSemanticColors extends ThemeExtension<AppSemanticColors> {
  const AppSemanticColors({
    required this.success,
    required this.onSuccess,
    required this.successContainer,
    required this.warning,
    required this.onWarning,
    required this.warningContainer,
    required this.info,
    required this.onInfo,
    required this.infoContainer,
    required this.surfaceMuted,
    required this.border,
    required this.textMuted,
    required this.accent,
    required this.onAccent,
  });

  final Color success;
  final Color onSuccess;
  final Color successContainer;
  final Color warning;
  final Color onWarning;
  final Color warningContainer;
  final Color info;
  final Color onInfo;
  final Color infoContainer;
  final Color surfaceMuted;
  final Color border;
  final Color textMuted;
  final Color accent;
  final Color onAccent;

  static const light = AppSemanticColors(
    success: AppPalette.success700,
    onSuccess: Colors.white,
    successContainer: AppPalette.success50,
    warning: AppPalette.warning700,
    onWarning: Colors.white,
    warningContainer: AppPalette.warning50,
    info: AppPalette.info700,
    onInfo: Colors.white,
    infoContainer: AppPalette.info50,
    surfaceMuted: AppPalette.lightSurfaceMuted,
    border: AppPalette.lightBorder,
    textMuted: AppPalette.lightTextMuted,
    accent: AppPalette.accent500,
    onAccent: AppPalette.brand950,
  );

  static const dark = AppSemanticColors(
    success: AppPalette.success500,
    onSuccess: AppPalette.brand950,
    successContainer: Color(0xFF0E2C1C),
    warning: AppPalette.warning500,
    onWarning: AppPalette.brand950,
    warningContainer: Color(0xFF2E2310),
    info: Color(0xFF60A5FA),
    onInfo: AppPalette.brand950,
    infoContainer: Color(0xFF11243F),
    surfaceMuted: AppPalette.darkSurfaceMuted,
    border: AppPalette.darkBorder,
    textMuted: AppPalette.darkTextMuted,
    accent: AppPalette.accent500,
    onAccent: AppPalette.brand950,
  );

  @override
  AppSemanticColors copyWith({
    Color? success,
    Color? onSuccess,
    Color? successContainer,
    Color? warning,
    Color? onWarning,
    Color? warningContainer,
    Color? info,
    Color? onInfo,
    Color? infoContainer,
    Color? surfaceMuted,
    Color? border,
    Color? textMuted,
    Color? accent,
    Color? onAccent,
  }) {
    return AppSemanticColors(
      success: success ?? this.success,
      onSuccess: onSuccess ?? this.onSuccess,
      successContainer: successContainer ?? this.successContainer,
      warning: warning ?? this.warning,
      onWarning: onWarning ?? this.onWarning,
      warningContainer: warningContainer ?? this.warningContainer,
      info: info ?? this.info,
      onInfo: onInfo ?? this.onInfo,
      infoContainer: infoContainer ?? this.infoContainer,
      surfaceMuted: surfaceMuted ?? this.surfaceMuted,
      border: border ?? this.border,
      textMuted: textMuted ?? this.textMuted,
      accent: accent ?? this.accent,
      onAccent: onAccent ?? this.onAccent,
    );
  }

  @override
  AppSemanticColors lerp(ThemeExtension<AppSemanticColors>? other, double t) {
    if (other is! AppSemanticColors) return this;
    return AppSemanticColors(
      success: Color.lerp(success, other.success, t)!,
      onSuccess: Color.lerp(onSuccess, other.onSuccess, t)!,
      successContainer: Color.lerp(successContainer, other.successContainer, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      onWarning: Color.lerp(onWarning, other.onWarning, t)!,
      warningContainer: Color.lerp(warningContainer, other.warningContainer, t)!,
      info: Color.lerp(info, other.info, t)!,
      onInfo: Color.lerp(onInfo, other.onInfo, t)!,
      infoContainer: Color.lerp(infoContainer, other.infoContainer, t)!,
      surfaceMuted: Color.lerp(surfaceMuted, other.surfaceMuted, t)!,
      border: Color.lerp(border, other.border, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      onAccent: Color.lerp(onAccent, other.onAccent, t)!,
    );
  }
}

/// Tema uzantısına kısa erişim.
extension AppThemeX on BuildContext {
  AppSemanticColors get semanticColors => Theme.of(this).extension<AppSemanticColors>()!;
  ColorScheme get colors => Theme.of(this).colorScheme;
  TextTheme get textStyles => Theme.of(this).textTheme;
}
