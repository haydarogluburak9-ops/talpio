import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Uygulamanın standart kart yüzeyi: yumuşak kenarlık, tutarlı yarıçap ve boşluk.
class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.padding = AppSpacing.cardPadding,
    this.onTap,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final content = Padding(padding: padding, child: child);

    return Material(
      color: context.colors.surface,
      borderRadius: AppRadius.cardRadius,
      child: onTap == null
          ? _Bordered(child: content)
          : InkWell(
              onTap: onTap,
              borderRadius: AppRadius.cardRadius,
              child: _Bordered(child: content),
            ),
    );
  }
}

class _Bordered extends StatelessWidget {
  const _Bordered({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: AppRadius.cardRadius,
        border: Border.all(color: context.semanticColors.border),
      ),
      child: child,
    );
  }
}

/// Başlık ve açıklamayı standart biçimde gösteren kart başlığı.
class AppCardHeader extends StatelessWidget {
  const AppCardHeader({super.key, required this.title, this.subtitle, this.trailing});

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: context.textStyles.titleMedium),
              if (subtitle != null) ...[
                const SizedBox(height: AppSpacing.xxs),
                Text(subtitle!, style: context.textStyles.bodySmall),
              ],
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}
