import 'package:flutter/material.dart';

import '../../../core/localization/generated/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Açılış ekranı. Faz 2'de oturum kontrolü ve yönlendirme mantığı buraya bağlanacak.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppPalette.brand900,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: const BoxDecoration(
                color: AppPalette.brand600,
                borderRadius: AppRadius.cardRadius,
              ),
              alignment: Alignment.center,
              child: const Text(
                'UP',
                style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w800),
              ),
            ),
            AppSpacing.gapLg,
            Text(
              l10n.appName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w700,
              ),
            ),
            AppSpacing.gapXs,
            Text(
              l10n.appTagline,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppPalette.brand200, fontSize: 14),
            ),
            AppSpacing.gapXl,
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                valueColor: AlwaysStoppedAnimation(AppPalette.accent500),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
