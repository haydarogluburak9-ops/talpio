/// Tek bir altyapı bileşeninin durumu.
class HealthComponent {
  const HealthComponent({required this.key, required this.isUp, this.responseTimeMs, this.message});

  final String key;
  final bool isUp;
  final int? responseTimeMs;
  final String? message;
}

/// API ve bağımlı servislerin genel sağlık durumu.
class SystemHealth {
  const SystemHealth({required this.isHealthy, required this.components});

  final bool isHealthy;
  final List<HealthComponent> components;

  bool get hasDegradedComponent => components.any((component) => !component.isUp);
}
