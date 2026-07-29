import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/splash/presentation/splash_screen.dart';
import '../../features/system_status/presentation/screens/system_status_screen.dart';
import '../localization/generated/app_localizations.dart';
import '../widgets/app_state_views.dart';
import 'app_routes.dart';

/// Uygulama başlangıcında yapılan hazırlık işleri (oturum okuma, sürüm kontrolü).
/// Faz 2'de token yenileme buraya eklenecektir.
final appBootstrapProvider = FutureProvider<void>((ref) async {
  await Future<void>.delayed(const Duration(milliseconds: 600));
});

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: false,
    routes: [
      GoRoute(path: AppRoutes.splash, builder: (context, state) => const _SplashGate()),
      GoRoute(
        path: AppRoutes.systemStatus,
        builder: (context, state) => const SystemStatusScreen(),
      ),
    ],
    errorBuilder: (context, state) {
      final l10n = AppLocalizations.of(context);
      return Scaffold(
        body: AppErrorState(
          title: l10n.errorGenericTitle,
          message: state.error?.toString() ?? l10n.errorGenericMessage,
          onRetry: () => context.go(AppRoutes.splash),
        ),
      );
    },
  );
});

/// Açılış hazırlıkları bitince bir sonraki ekrana geçer.
class _SplashGate extends ConsumerWidget {
  const _SplashGate();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(appBootstrapProvider, (previous, next) {
      if (next.hasValue && context.mounted) {
        // Faz 2'de oturum durumuna göre giriş veya ana sayfaya yönlendirilecek.
        context.go(AppRoutes.systemStatus);
      }
    });

    return const SplashScreen();
  }
}
