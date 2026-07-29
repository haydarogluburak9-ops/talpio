import 'package:flutter/material.dart';

import '../localization/generated/app_localizations.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Yükleniyor göstergesi. Tam ekran veya satır içi kullanılabilir.
class AppLoading extends StatelessWidget {
  const AppLoading({super.key, this.label, this.compact = false});

  final String? label;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final indicator = SizedBox(
      width: compact ? 20 : 32,
      height: compact ? 20 : 32,
      child: CircularProgressIndicator(strokeWidth: compact ? 2 : 3),
    );

    if (compact) return Center(child: indicator);

    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          indicator,
          if (label != null) ...[
            AppSpacing.gapSm,
            Text(label!, style: context.textStyles.bodySmall),
          ],
        ],
      ),
    );
  }
}

/// Veri yokken gösterilen durum.
class AppEmptyState extends StatelessWidget {
  const AppEmptyState({
    super.key,
    this.icon = Icons.inbox_outlined,
    this.title,
    this.message,
    this.action,
  });

  final IconData icon;
  final String? title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final semantic = context.semanticColors;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(color: semantic.surfaceMuted, shape: BoxShape.circle),
              child: Icon(icon, size: 32, color: semantic.textMuted),
            ),
            AppSpacing.gapMd,
            Text(
              title ?? l10n.emptyStateTitle,
              style: context.textStyles.titleMedium,
              textAlign: TextAlign.center,
            ),
            AppSpacing.gapXs,
            Text(
              message ?? l10n.emptyStateMessage,
              style: context.textStyles.bodySmall,
              textAlign: TextAlign.center,
            ),
            if (action != null) ...[AppSpacing.gapMd, action!],
          ],
        ),
      ),
    );
  }
}

/// Hata durumu ve yeniden deneme aksiyonu.
class AppErrorState extends StatelessWidget {
  const AppErrorState({super.key, required this.title, required this.message, this.onRetry});

  final String title;
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final colors = context.colors;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(color: colors.errorContainer, shape: BoxShape.circle),
              child: Icon(Icons.error_outline, size: 32, color: colors.error),
            ),
            AppSpacing.gapMd,
            Text(title, style: context.textStyles.titleMedium, textAlign: TextAlign.center),
            AppSpacing.gapXs,
            Text(message, style: context.textStyles.bodySmall, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              AppSpacing.gapMd,
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: Text(l10n.commonRetry),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
