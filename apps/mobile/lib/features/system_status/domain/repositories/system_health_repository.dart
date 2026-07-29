import '../entities/system_health.dart';

/// Sunum katmanının bağımlı olduğu soyutlama.
/// Uygulaması veri katmanındadır; testlerde sahte (fake) uygulama kullanılır.
abstract interface class SystemHealthRepository {
  /// Hata durumunda [Failure] fırlatır.
  Future<SystemHealth> fetchHealth();
}
