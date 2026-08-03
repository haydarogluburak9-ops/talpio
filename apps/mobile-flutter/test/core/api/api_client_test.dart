import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ustapilot/core/api/api_client.dart';
import 'package:ustapilot/core/errors/failure.dart';

/// Ağa çıkmadan belirlenmiş yanıtlar döndüren test adaptörü.
class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter({this.statusCode = 200, this.body, this.throwOnFetch});

  final int statusCode;
  final Map<String, dynamic>? body;
  final DioException? throwOnFetch;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    final failure = throwOnFetch;
    if (failure != null) throw failure;

    return ResponseBody.fromString(
      jsonEncode(body ?? <String, dynamic>{}),
      statusCode,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }
}

ApiClient buildClient(HttpClientAdapter adapter) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test.local/api/v1'))..httpClientAdapter = adapter;
  return ApiClient(dio: dio);
}

void main() {
  group('ApiClient başarı zarfı', () {
    test('data alanını çözer', () async {
      final client = buildClient(
        _FakeAdapter(
          body: {
            'success': true,
            'data': {'id': '42', 'name': 'Gaziantep'},
          },
        ),
      );

      final response = await client.get<String>(
        '/cities/42',
        parse: (data) => (data! as Map<String, dynamic>)['name'] as String,
      );

      expect(response.data, 'Gaziantep');
      expect(response.meta, isNull);
    });

    test('meta alanını taşır', () async {
      final client = buildClient(
        _FakeAdapter(
          body: {
            'success': true,
            'data': <dynamic>[],
            'meta': {'page': 2, 'total': 40},
          },
        ),
      );

      final response = await client.get<int>(
        '/cities',
        parse: (data) => (data! as List<dynamic>).length,
      );

      expect(response.data, 0);
      expect(response.meta?['page'], 2);
    });
  });

  group('ApiClient hata eşlemesi', () {
    test('409 yanıtını ConflictFailure yapar ve sunucu mesajını korur', () async {
      final client = buildClient(
        _FakeAdapter(
          statusCode: 409,
          body: {
            'success': false,
            'error': {
              'code': 'OFFER_ALREADY_ACCEPTED',
              'message': 'Bu iş için zaten bir usta seçilmiş.',
            },
          },
        ),
      );

      await expectLater(
        client.get<void>('/offers/1/accept', parse: (_) {}),
        throwsA(
          isA<ConflictFailure>()
              .having((f) => f.code, 'code', 'OFFER_ALREADY_ACCEPTED')
              .having(
                (f) => f.serverMessage,
                'serverMessage',
                'Bu iş için zaten bir usta seçilmiş.',
              ),
        ),
      );
    });

    test('422 yanıtında alan hatalarını ayrıştırır', () async {
      final client = buildClient(
        _FakeAdapter(
          statusCode: 422,
          body: {
            'success': false,
            'error': {
              'code': 'VALIDATION_ERROR',
              'message': 'Gönderilen bilgiler geçerli değil.',
              'details': [
                {'field': 'email', 'issue': 'Geçerli bir e-posta giriniz'},
                {'issue': 'Alan bazlı olmayan hata'},
              ],
            },
          },
        ),
      );

      await expectLater(
        client.post<void>('/auth/register', parse: (_) {}),
        throwsA(
          isA<ValidationFailure>().having((f) => f.fieldIssues, 'fieldIssues', {
            'email': 'Geçerli bir e-posta giriniz',
          }),
        ),
      );
    });

    test('401 yanıtını UnauthorizedFailure yapar', () async {
      final client = buildClient(
        _FakeAdapter(
          statusCode: 401,
          body: {
            'success': false,
            'error': {'code': 'TOKEN_EXPIRED', 'message': 'Oturum süresi doldu.'},
          },
        ),
      );

      await expectLater(
        client.get<void>('/users/me', parse: (_) {}),
        throwsA(isA<UnauthorizedFailure>()),
      );
    });

    test('bağlantı hatasını NetworkFailure yapar', () async {
      final client = buildClient(
        _FakeAdapter(
          throwOnFetch: DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            type: DioExceptionType.connectionError,
          ),
        ),
      );

      await expectLater(
        client.get<void>('/users/me', parse: (_) {}),
        throwsA(isA<NetworkFailure>()),
      );
    });

    test('zaman aşımını TimeoutFailure yapar', () async {
      final client = buildClient(
        _FakeAdapter(
          throwOnFetch: DioException(
            requestOptions: RequestOptions(path: '/users/me'),
            type: DioExceptionType.receiveTimeout,
          ),
        ),
      );

      await expectLater(
        client.get<void>('/users/me', parse: (_) {}),
        throwsA(isA<TimeoutFailure>()),
      );
    });

    test('zarfsız yanıtta beklenmeyen durum kodunu hataya çevirir', () async {
      final client = buildClient(_FakeAdapter(statusCode: 500, body: {'status': 'error'}));

      await expectLater(
        client.getRaw<void>(
          'http://test.local/health/ready',
          parse: (_) {},
          acceptedStatuses: const {200, 503},
        ),
        throwsA(isA<ServerFailure>()),
      );
    });

    test('sağlık ucunda 503 kabul edilir ve gövde ayrıştırılır', () async {
      final client = buildClient(
        _FakeAdapter(
          statusCode: 503,
          body: {
            'status': 'error',
            'details': {
              'redis': {'status': 'down'},
            },
          },
        ),
      );

      final status = await client.getRaw<String>(
        'http://test.local/health/ready',
        acceptedStatuses: const {200, 503},
        parse: (data) => (data! as Map<String, dynamic>)['status'] as String,
      );

      expect(status, 'error');
    });
  });
}
