import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ustapilot/app/app.dart';
import 'package:ustapilot/core/localization/generated/app_localizations.dart';
import 'package:ustapilot/core/routing/app_router.dart';
import 'package:ustapilot/features/system_status/domain/entities/system_health.dart';
import 'package:ustapilot/features/system_status/domain/repositories/system_health_repository.dart';
import 'package:ustapilot/features/system_status/presentation/providers/system_health_provider.dart';

/// Ağa çıkmadan sabit bir sağlık yanıtı döndüren depo.
class _FakeSystemHealthRepository implements SystemHealthRepository {
  _FakeSystemHealthRepository(this.health);

  final SystemHealth health;

  @override
  Future<SystemHealth> fetchHealth() async => health;
}

void main() {
  testWidgets('açılış ekranı marka adını ve sloganı gösterir', (tester) async {
    // Hazırlık tamamlanmadığı sürece açılış ekranında kalınır.
    final blocked = Completer<void>();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [appBootstrapProvider.overrideWith((ref) => blocked.future)],
        child: const UstaPilotApp(),
      ),
    );
    await tester.pump();

    expect(find.text('UstaPilot'), findsWidgets);
    expect(find.text('Doğru usta. Doğru fiyat. Güvenli hizmet.'), findsOneWidget);
  });

  testWidgets('hazırlık bitince sistem durumu ekranına geçilir', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appBootstrapProvider.overrideWith((ref) async {}),
          systemHealthRepositoryProvider.overrideWithValue(
            _FakeSystemHealthRepository(
              const SystemHealth(
                isHealthy: true,
                components: [
                  HealthComponent(key: 'database', isUp: true, responseTimeMs: 4),
                  HealthComponent(key: 'redis', isUp: true, responseTimeMs: 2),
                ],
              ),
            ),
          ),
        ],
        child: const UstaPilotApp(),
      ),
    );

    // Bootstrap tamamlanır, yönlendirme yapılır ve sağlık verisi çözülür.
    for (var i = 0; i < 4; i++) {
      await tester.pump(const Duration(milliseconds: 50));
    }

    expect(find.text('PostgreSQL'), findsOneWidget);
    expect(find.text('Redis'), findsOneWidget);
  });

  testWidgets('İngilizce yerelleştirme yüklenir', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        locale: Locale('en'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: _TaglineProbe(),
      ),
    );
    await tester.pump();

    expect(find.text('The right pro. The right price. Safe service.'), findsOneWidget);
  });
}

class _TaglineProbe extends StatelessWidget {
  const _TaglineProbe();

  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Text(AppLocalizations.of(context).appTagline));
  }
}
