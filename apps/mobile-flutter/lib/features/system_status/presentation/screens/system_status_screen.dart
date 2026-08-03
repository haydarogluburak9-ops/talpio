import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/app_config.dart';
import '../../../../core/errors/failure.dart';
import '../../../../core/errors/failure_messages.dart';
import '../../../../core/localization/generated/app_localizations.dart';
import '../../../../core/providers/app_providers.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_state_views.dart';
import '../../../../core/widgets/status_chip.dart';
import '../../domain/entities/system_health.dart';
import '../providers/system_health_provider.dart';

/// Faz 1 doğrulama ekranı: uygulamanın gerçek API'ye bağlandığını gösterir.
/// Faz 2 ile birlikte yerini giriş akışına bırakacaktır.
class SystemStatusScreen extends ConsumerWidget {
  const SystemStatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final health = ref.watch(systemHealthProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appName),
        actions: [
          IconButton(
            onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            icon: const Icon(Icons.brightness_6_outlined),
            tooltip: l10n.commonRefresh,
          ),
          _LocaleSwitch(),
          AppSpacing.gapXs,
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(systemHealthProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: AppSpacing.screenPadding,
          children: [
            _Header(l10n: l10n),
            AppSpacing.gapMd,
            AppCard(
              child: switch (health) {
                AsyncData(:final value) => _HealthContent(health: value, l10n: l10n),
                AsyncError(:final error) => _HealthError(error: error, l10n: l10n, ref: ref),
                _ => const SizedBox(height: 120, child: AppLoading()),
              },
            ),
            AppSpacing.gapMd,
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppCardHeader(title: l10n.phaseNoticeTitle, subtitle: l10n.phaseNoticeMessage),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.appTagline, style: context.textStyles.titleLarge),
        AppSpacing.gapXxs,
        Text(
          l10n.systemStatusEnvironment(AppConfig.environment.name),
          style: context.textStyles.bodySmall,
        ),
      ],
    );
  }
}

class _HealthContent extends StatelessWidget {
  const _HealthContent({required this.health, required this.l10n});

  final SystemHealth health;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppCardHeader(
          title: l10n.systemStatusTitle,
          subtitle: l10n.systemStatusSubtitle,
          trailing: StatusChip(
            label: health.isHealthy ? l10n.systemStatusHealthy : l10n.systemStatusDegraded,
            tone: health.isHealthy ? StatusTone.success : StatusTone.warning,
            icon: health.isHealthy ? Icons.check_circle_outline : Icons.warning_amber_outlined,
          ),
        ),
        AppSpacing.gapMd,
        for (final component in health.components) ...[
          _ComponentRow(component: component, l10n: l10n),
          if (component != health.components.last) AppSpacing.gapXs,
        ],
      ],
    );
  }
}

class _ComponentRow extends StatelessWidget {
  const _ComponentRow({required this.component, required this.l10n});

  final HealthComponent component;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final semantic = context.semanticColors;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.sm),
      decoration: BoxDecoration(
        color: semantic.surfaceMuted,
        borderRadius: AppRadius.controlRadius,
      ),
      child: Row(
        children: [
          Icon(
            component.isUp ? Icons.check_circle : Icons.error_outline,
            size: 18,
            color: component.isUp ? semantic.success : context.colors.error,
          ),
          AppSpacing.gapXs,
          Expanded(
            child: Text(_componentLabel(component.key), style: context.textStyles.bodyMedium),
          ),
          if (component.responseTimeMs != null) ...[
            Text(
              l10n.systemStatusResponseTime(component.responseTimeMs!),
              style: context.textStyles.bodySmall,
            ),
            AppSpacing.gapXs,
          ],
          StatusChip(
            label: component.isUp ? l10n.systemStatusComponentUp : l10n.systemStatusComponentDown,
            tone: component.isUp ? StatusTone.success : StatusTone.danger,
          ),
        ],
      ),
    );
  }

  String _componentLabel(String key) => switch (key) {
    'database' => 'PostgreSQL',
    'redis' => 'Redis',
    _ => key,
  };
}

class _HealthError extends StatelessWidget {
  const _HealthError({required this.error, required this.l10n, required this.ref});

  final Object error;
  final AppLocalizations l10n;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final failure = error is Failure ? error as Failure : const UnknownFailure();

    return SizedBox(
      height: 220,
      child: AppErrorState(
        title: l10n.systemStatusUnreachable,
        message: failure.localizedMessage(l10n),
        onRetry: () => ref.invalidate(systemHealthProvider),
      ),
    );
  }
}

class _LocaleSwitch extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);

    return TextButton(
      onPressed: () {
        final next = locale.languageCode == 'tr' ? const Locale('en') : const Locale('tr');
        ref.read(localeProvider.notifier).setLocale(next);
      },
      child: Text(locale.languageCode.toUpperCase()),
    );
  }
}
