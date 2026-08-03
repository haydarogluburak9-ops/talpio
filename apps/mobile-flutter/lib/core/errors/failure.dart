/// Uygulama katmanının tanıdığı tek hata tipi.
///
/// Ağ, sunucu ve doğrulama hataları veri katmanında bu tipe dönüştürülür;
/// sunum katmanı `DioException` gibi altyapı tiplerini hiç görmez.
sealed class Failure implements Exception {
  const Failure({this.code, this.serverMessage});

  /// Backend'in makine-okunur hata kodu (örn. `OFFER_ALREADY_ACCEPTED`).
  final String? code;

  /// Backend'in kullanıcıya gösterilebilir mesajı. Varsa yerel metne tercih edilir.
  final String? serverMessage;

  @override
  String toString() => '$runtimeType(code: $code, message: $serverMessage)';
}

/// Sunucuya hiç ulaşılamadı (bağlantı yok, DNS, kapalı sunucu).
final class NetworkFailure extends Failure {
  const NetworkFailure({super.serverMessage});
}

/// İstek zaman aşımına uğradı.
final class TimeoutFailure extends Failure {
  const TimeoutFailure();
}

/// Sunucu 5xx döndürdü.
final class ServerFailure extends Failure {
  const ServerFailure({super.code, super.serverMessage});
}

/// Oturum geçersiz veya süresi dolmuş (401).
final class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.code, super.serverMessage});
}

/// Yetki yok (403).
final class ForbiddenFailure extends Failure {
  const ForbiddenFailure({super.code, super.serverMessage});
}

/// Kaynak bulunamadı (404).
final class NotFoundFailure extends Failure {
  const NotFoundFailure({super.code, super.serverMessage});
}

/// Alan doğrulama hatası (422).
final class ValidationFailure extends Failure {
  const ValidationFailure({super.code, super.serverMessage, this.fieldIssues = const {}});

  /// Alan adı -> hata mesajı eşlemesi. Form alanlarının altına yazdırılır.
  final Map<String, String> fieldIssues;
}

/// İş kuralı çakışması (409) ve diğer beklenen 4xx durumları.
final class ConflictFailure extends Failure {
  const ConflictFailure({super.code, super.serverMessage});
}

/// İstek limiti aşıldı (429).
final class RateLimitFailure extends Failure {
  const RateLimitFailure({super.code, super.serverMessage});
}

/// Sınıflandırılamayan hata.
final class UnknownFailure extends Failure {
  const UnknownFailure({super.code, super.serverMessage});
}
