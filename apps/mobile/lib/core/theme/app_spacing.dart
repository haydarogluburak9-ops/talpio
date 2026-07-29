import 'package:flutter/widgets.dart';

/// Tutarlı boşluk ölçeği. Ekranlarda serbest sayı kullanılmaz.
abstract final class AppSpacing {
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;

  static const EdgeInsets screenPadding = EdgeInsets.symmetric(horizontal: md, vertical: md);
  static const EdgeInsets cardPadding = EdgeInsets.all(md);

  static const SizedBox gapXxs = SizedBox(height: xxs, width: xxs);
  static const SizedBox gapXs = SizedBox(height: xs, width: xs);
  static const SizedBox gapSm = SizedBox(height: sm, width: sm);
  static const SizedBox gapMd = SizedBox(height: md, width: md);
  static const SizedBox gapLg = SizedBox(height: lg, width: lg);
  static const SizedBox gapXl = SizedBox(height: xl, width: xl);
}

/// Köşe yarıçapı ölçeği.
abstract final class AppRadius {
  static const double control = 12;
  static const double card = 16;
  static const double sheet = 24;
  static const double pill = 999;

  static const BorderRadius controlRadius = BorderRadius.all(Radius.circular(control));
  static const BorderRadius cardRadius = BorderRadius.all(Radius.circular(card));
  static const BorderRadius sheetRadius = BorderRadius.vertical(top: Radius.circular(sheet));
  static const BorderRadius pillRadius = BorderRadius.all(Radius.circular(pill));
}
