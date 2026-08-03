/// Derleme zamanında `--dart-define` ile verilen yapılandırma.
///
/// Örnek:
/// `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1`
///
/// Android emülatöründe host makineye `10.0.2.2`, iOS simülatöründe `localhost`
/// üzerinden erişilir; bu yüzden varsayılan değer platforma göre seçilir.
/// Platform tespiti `dart:io` yerine `defaultTargetPlatform` ile yapılır; böylece
/// web derlemesi de mümkün kalır.
library;

import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

enum AppEnvironment { development, staging, production }

abstract final class AppConfig {
  static const String _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');
  static const String _environmentName = String.fromEnvironment(
    'APP_ENV',
    defaultValue: 'development',
  );

  static AppEnvironment get environment => switch (_environmentName) {
    'production' => AppEnvironment.production,
    'staging' => AppEnvironment.staging,
    _ => AppEnvironment.development,
  };

  static bool get isProduction => environment == AppEnvironment.production;

  /// API taban adresi. Sağlık uçları bu adresin kökündedir.
  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    return '$_defaultHost/api/v1';
  }

  static String get apiOrigin {
    final uri = Uri.parse(apiBaseUrl);
    return '${uri.scheme}://${uri.authority}';
  }

  static String get _defaultHost {
    // Android emülatörü host makineyi 10.0.2.2 üzerinden görür.
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000';
    }
    return 'http://localhost:3000';
  }

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 20);

  static const String defaultLocale = 'tr';
  static const List<String> supportedLocales = ['tr', 'en'];
}
