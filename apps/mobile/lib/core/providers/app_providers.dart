import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../config/app_config.dart';

/// Uygulama genelinde tek [ApiClient] örneği.
final apiClientProvider = Provider<ApiClient>((ref) {
  final client = ApiClient();
  client.setLocale(AppConfig.defaultLocale);
  ref.onDispose(client.raw.close);
  return client;
});

/// Seçili tema kipi. Faz 2'de kalıcı depolamaya bağlanacaktır.
class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ThemeMode.system;

  void setMode(ThemeMode mode) => state = mode;

  void toggle() {
    state = switch (state) {
      ThemeMode.light => ThemeMode.dark,
      ThemeMode.dark => ThemeMode.light,
      ThemeMode.system => ThemeMode.dark,
    };
  }
}

final themeModeProvider = NotifierProvider<ThemeModeNotifier, ThemeMode>(ThemeModeNotifier.new);

/// Seçili dil. Sistem dili desteklenmiyorsa Türkçeye düşer.
class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() => const Locale(AppConfig.defaultLocale);

  void setLocale(Locale locale) {
    if (!AppConfig.supportedLocales.contains(locale.languageCode)) return;
    state = locale;
    ref.read(apiClientProvider).setLocale(locale.languageCode);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);
