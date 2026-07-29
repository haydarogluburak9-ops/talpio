import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/providers/app_providers.dart';
import '../../data/repositories/system_health_repository_impl.dart';
import '../../domain/entities/system_health.dart';
import '../../domain/repositories/system_health_repository.dart';

final systemHealthRepositoryProvider = Provider<SystemHealthRepository>((ref) {
  return SystemHealthRepositoryImpl(ref.watch(apiClientProvider));
});

final systemHealthProvider = FutureProvider.autoDispose<SystemHealth>((ref) {
  return ref.watch(systemHealthRepositoryProvider).fetchHealth();
});
