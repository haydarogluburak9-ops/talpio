import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Durum rozetinin anlamsal tonu.
enum StatusTone { neutral, brand, success, warning, danger, info }

/// İş durumu, doğrulama durumu ve benzeri kısa etiketler için rozet.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.label, this.tone = StatusTone.neutral, this.icon});

  final String label;
  final StatusTone tone;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final semantic = context.semanticColors;
    final colors = context.colors;

    final (background, foreground) = switch (tone) {
      StatusTone.neutral => (semantic.surfaceMuted, semantic.textMuted),
      StatusTone.brand => (colors.primaryContainer, colors.onPrimaryContainer),
      StatusTone.success => (semantic.successContainer, semantic.success),
      StatusTone.warning => (semantic.warningContainer, semantic.warning),
      StatusTone.danger => (colors.errorContainer, colors.error),
      StatusTone.info => (semantic.infoContainer, semantic.info),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xxs + 2),
      decoration: BoxDecoration(color: background, borderRadius: AppRadius.pillRadius),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: foreground),
            const SizedBox(width: AppSpacing.xxs + 2),
          ],
          Text(
            label,
            style: context.textStyles.labelMedium?.copyWith(
              color: foreground,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
