import '../localization/generated/app_localizations.dart';
import 'failure.dart';

/// [Failure] tipini kullanıcıya gösterilecek yerelleştirilmiş metne çevirir.
///
/// Sunucu kullanıcıya uygun bir mesaj göndermişse o tercih edilir; böylece
/// iş kuralı hataları ("Bu iş için zaten usta seçilmiş") olduğu gibi gösterilir.
extension FailureMessage on Failure {
  String localizedMessage(AppLocalizations l10n) {
    final fromServer = serverMessage;
    if (fromServer != null && fromServer.isNotEmpty && _hasReadableServerMessage) {
      return fromServer;
    }

    return switch (this) {
      NetworkFailure() => l10n.errorNetworkMessage,
      TimeoutFailure() => l10n.errorTimeoutMessage,
      ServerFailure() => l10n.errorServerMessage,
      UnauthorizedFailure() => l10n.errorUnauthorizedMessage,
      _ => l10n.errorGenericMessage,
    };
  }

  String localizedTitle(AppLocalizations l10n) {
    return switch (this) {
      NetworkFailure() || TimeoutFailure() => l10n.errorNetworkTitle,
      _ => l10n.errorGenericTitle,
    };
  }

  /// Ağ katmanı mesajları (Dio metinleri) kullanıcıya gösterilmez.
  bool get _hasReadableServerMessage => switch (this) {
    NetworkFailure() || TimeoutFailure() => false,
    _ => true,
  };
}
