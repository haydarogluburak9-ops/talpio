import '../../../../core/api/api_client.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/errors/failure.dart';
import '../../domain/entities/system_health.dart';
import '../../domain/repositories/system_health_repository.dart';
import '../models/health_check_dto.dart';

class SystemHealthRepositoryImpl implements SystemHealthRepository {
  const SystemHealthRepositoryImpl(this._client);

  final ApiClient _client;

  @override
  Future<SystemHealth> fetchHealth() {
    // Sağlık uçları API ön ekinin dışında olduğu için tam adresle çağrılır.
    return _client.getRaw(
      '${AppConfig.apiOrigin}/health/ready',
      // Bileşenlerden biri kapalıyken 503 döner; gövde hangisinin bozuk
      // olduğunu içerdiği için hata sayılmaz.
      acceptedStatuses: const {200, 503},
      parse: (data) {
        if (data is! Map<String, dynamic>) {
          throw const UnknownFailure(code: 'INVALID_RESPONSE');
        }
        return HealthCheckDto.fromJson(data).toEntity();
      },
    );
  }
}
