import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import '../core/localization/generated/app_localizations.dart';
import '../core/providers/app_providers.dart';
import '../core/routing/app_router.dart';
import '../core/theme/app_theme.dart';

class UstaPilotApp extends ConsumerWidget {
  const UstaPilotApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);

    return MaterialApp.router(
      title: 'UstaPilot',
      debugShowCheckedModeBanner: !AppConfig.isProduction,
      routerConfig: router,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      localeResolutionCallback: (deviceLocale, supported) {
        // Cihaz dili desteklenmiyorsa Türkçeye düşülür.
        final match = supported.where(
          (candidate) => candidate.languageCode == deviceLocale?.languageCode,
        );
        return match.isNotEmpty ? match.first : const Locale(AppConfig.defaultLocale);
      },
    );
  }
}
