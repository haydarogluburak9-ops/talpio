import '../../domain/entities/system_health.dart';

/// Terminus sağlık kontrolü yanıtı.
///
/// Biçim: `{ status, info: {...}, error: {...}, details: { key: { status, ... } } }`
class HealthCheckDto {
  const HealthCheckDto({required this.status, required this.details});

  factory HealthCheckDto.fromJson(Map<String, dynamic> json) {
    final rawDetails = json['details'];
    final details = <String, HealthComponentDto>{};

    if (rawDetails is Map<String, dynamic>) {
      rawDetails.forEach((key, value) {
        if (value is Map<String, dynamic>) {
          details[key] = HealthComponentDto.fromJson(value);
        }
      });
    }

    return HealthCheckDto(status: json['status'] as String? ?? 'error', details: details);
  }

  final String status;
  final Map<String, HealthComponentDto> details;

  SystemHealth toEntity() {
    return SystemHealth(
      isHealthy: status == 'ok',
      components: details.entries
          .map(
            (entry) => HealthComponent(
              key: entry.key,
              isUp: entry.value.status == 'up',
              responseTimeMs: entry.value.responseTimeMs,
              message: entry.value.message,
            ),
          )
          .toList(growable: false),
    );
  }
}

class HealthComponentDto {
  const HealthComponentDto({required this.status, this.responseTimeMs, this.message});

  factory HealthComponentDto.fromJson(Map<String, dynamic> json) {
    return HealthComponentDto(
      status: json['status'] as String? ?? 'down',
      responseTimeMs: json['responseTimeMs'] as int?,
      message: json['message'] as String?,
    );
  }

  final String status;
  final int? responseTimeMs;
  final String? message;
}
