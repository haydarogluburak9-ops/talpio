import 'package:dio/dio.dart';

import '../config/app_config.dart';
import '../errors/failure.dart';
import 'api_response.dart';

/// Backend ile tek iletişim noktası.
///
/// Sorumlulukları:
/// - Standart yanıt zarfını açmak,
/// - Hataları [Failure] tipine çevirmek,
/// - Ortak başlıkları (dil, içerik türü) eklemek.
///
/// Kimlik doğrulama interceptor'ı Faz 2'de eklenecektir.
class ApiClient {
  ApiClient({Dio? dio, String? baseUrl}) : _dio = dio ?? Dio() {
    final existingBaseUrl = _dio.options.baseUrl;
    _dio.options
      ..baseUrl = baseUrl ?? (existingBaseUrl.isEmpty ? AppConfig.apiBaseUrl : existingBaseUrl)
      ..connectTimeout = AppConfig.connectTimeout
      ..receiveTimeout = AppConfig.receiveTimeout
      ..headers = {..._dio.options.headers, 'Accept': 'application/json'}
      // Hata durumlarını zarftan kendimiz yorumlarız.
      ..validateStatus = (status) => status != null && status < 500;
  }

  final Dio _dio;

  Dio get raw => _dio;

  /// İstek başına dil başlığını günceller.
  void setLocale(String localeCode) {
    _dio.options.headers['Accept-Language'] = localeCode;
  }

  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? query,
    required T Function(Object? data) parse,
  }) {
    return _send(() => _dio.get<dynamic>(path, queryParameters: query), parse);
  }

  Future<ApiResponse<T>> post<T>(
    String path, {
    Object? body,
    Map<String, dynamic>? query,
    required T Function(Object? data) parse,
  }) {
    return _send(() => _dio.post<dynamic>(path, data: body, queryParameters: query), parse);
  }

  Future<ApiResponse<T>> patch<T>(
    String path, {
    Object? body,
    required T Function(Object? data) parse,
  }) {
    return _send(() => _dio.patch<dynamic>(path, data: body), parse);
  }

  Future<ApiResponse<T>> delete<T>(String path, {required T Function(Object? data) parse}) {
    return _send(() => _dio.delete<dynamic>(path), parse);
  }

  /// Zarfsız yanıt döndüren uçlar (örn. `/health/ready`) için.
  ///
  /// [acceptedStatuses] içinde yer alan durum kodları hata sayılmaz; sağlık
  /// kontrolü bozuk durumda 503 döner ama gövdesi hâlâ anlamlıdır.
  Future<T> getRaw<T>(
    String url, {
    required T Function(Object? data) parse,
    Set<int> acceptedStatuses = const {200},
  }) async {
    try {
      final response = await _dio.get<dynamic>(
        url,
        options: Options(validateStatus: (status) => status != null && status < 600),
      );

      final status = response.statusCode ?? 0;
      if (!acceptedStatuses.contains(status)) {
        throw _failureFromStatus(status, null, null);
      }

      return parse(response.data);
    } on DioException catch (error) {
      throw _mapDioException(error);
    }
  }

  Future<ApiResponse<T>> _send<T>(
    Future<Response<dynamic>> Function() request,
    T Function(Object? data) parse,
  ) async {
    late final Response<dynamic> response;
    try {
      response = await request();
    } on DioException catch (error) {
      throw _mapDioException(error);
    }

    final body = response.data;
    if (body is! Map<String, dynamic>) {
      throw const UnknownFailure(code: 'INVALID_RESPONSE');
    }

    final isSuccess = body['success'] == true;
    if (!isSuccess) {
      throw _failureFromEnvelope(response.statusCode ?? 0, body);
    }

    return ApiResponse<T>(data: parse(body['data']), meta: body['meta'] as Map<String, dynamic>?);
  }

  Failure _failureFromEnvelope(int status, Map<String, dynamic> body) {
    final error = body['error'];
    if (error is! Map<String, dynamic>) {
      return _failureFromStatus(status, null, null);
    }

    final code = error['code'] as String?;
    final message = error['message'] as String?;

    if (status == 422) {
      return ValidationFailure(
        code: code,
        serverMessage: message,
        fieldIssues: _extractFieldIssues(error['details']),
      );
    }

    return _failureFromStatus(status, code, message);
  }

  Map<String, String> _extractFieldIssues(Object? details) {
    if (details is! List) return const {};

    final issues = <String, String>{};
    for (final entry in details) {
      if (entry is Map<String, dynamic>) {
        final field = entry['field'] as String?;
        final issue = entry['issue'] as String?;
        if (field != null && issue != null) issues[field] = issue;
      }
    }
    return issues;
  }

  Failure _failureFromStatus(int status, String? code, String? message) {
    return switch (status) {
      401 => UnauthorizedFailure(code: code, serverMessage: message),
      403 => ForbiddenFailure(code: code, serverMessage: message),
      404 => NotFoundFailure(code: code, serverMessage: message),
      409 => ConflictFailure(code: code, serverMessage: message),
      422 => ValidationFailure(code: code, serverMessage: message),
      429 => RateLimitFailure(code: code, serverMessage: message),
      >= 500 => ServerFailure(code: code, serverMessage: message),
      _ => UnknownFailure(code: code, serverMessage: message),
    };
  }

  /// Dio'nun hataya çevirdiği yanıtlarda da zarfı okumayı dener; böylece
  /// `validateStatus` yapılandırmasından bağımsız olarak sunucu hata kodu ve
  /// mesajı korunur.
  Failure _failureFromResponse(Response<dynamic>? response) {
    final status = response?.statusCode ?? 0;
    final body = response?.data;
    if (body is Map<String, dynamic>) {
      return _failureFromEnvelope(status, body);
    }
    return _failureFromStatus(status, null, null);
  }

  Failure _mapDioException(DioException error) {
    return switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => const TimeoutFailure(),
      DioExceptionType.connectionError ||
      DioExceptionType.unknown => NetworkFailure(serverMessage: error.message),
      DioExceptionType.transformTimeout => const TimeoutFailure(),
      DioExceptionType.badCertificate => const NetworkFailure(),
      DioExceptionType.cancel => const UnknownFailure(code: 'REQUEST_CANCELLED'),
      DioExceptionType.badResponse => _failureFromResponse(error.response),
    };
  }
}
